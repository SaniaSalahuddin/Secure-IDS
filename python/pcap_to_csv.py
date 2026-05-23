"""
Convert a Wireshark PCAP/PCAPNG capture into NSL-KDD-style CSV for the IDS upload.

Usage:
    pip install scapy
    python pcap_to_csv.py path/to/capture.pcap -o ../samples/from_wireshark.csv

Limitations:
    - Real from capture: duration, protocol, service, flag, bytes, land, fragments.
    - Host/rate fields are approximated over the whole file (not KDD 2-second windows).
    - logged_in, root_shell, hot, etc. default to 0.
    - Use samples/*.csv for reliable demo predictions.
"""

from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from dataclasses import dataclass
from typing import Any

try:
    from scapy.all import ICMP, IP, TCP, UDP, rdpcap
except ImportError as exc:
    raise SystemExit("Scapy is required. Install with: pip install scapy") from exc

FEATURE_NAMES = [
    "duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes",
    "land", "wrong_fragment", "urgent", "hot", "num_failed_logins", "logged_in",
    "num_compromised", "root_shell", "su_attempted", "num_root",
    "num_file_creations", "num_shells", "num_access_files", "num_outbound_cmds",
    "is_host_login", "is_guest_login", "count", "srv_count", "serror_rate",
    "srv_serror_rate", "rerror_rate", "srv_rerror_rate", "same_srv_rate",
    "diff_srv_rate", "srv_diff_host_rate", "dst_host_count", "dst_host_srv_count",
    "dst_host_same_srv_rate", "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate",
    "dst_host_rerror_rate", "dst_host_srv_rerror_rate",
]

PORT_TO_SERVICE: dict[int, str] = {
    20: "ftp_data", 21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp",
    53: "domain", 67: "dhcp", 68: "dhcp", 69: "tftp", 80: "http",
    110: "pop_3", 143: "imap", 443: "http", 445: "private", 3306: "private",
    3389: "private",
}


def port_to_service(port: int, proto: str) -> str:
    if port in PORT_TO_SERVICE:
        return PORT_TO_SERVICE[port]
    if proto == "icmp":
        return "eco_i"
    return "private"


def tcp_kdd_flag(syn: bool, fin: bool, rst: bool, ack: bool, psh: bool) -> str:
    if rst:
        return "REJ"
    if syn and not ack:
        return "S0"
    if syn and ack:
        return "S1"
    if fin and ack:
        return "SF"
    if fin:
        return "F2"
    if psh or ack:
        return "SF"
    return "OTH"


@dataclass
class FlowRecord:
    proto: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    service: str
    start: float
    end: float
    src_bytes: int = 0
    dst_bytes: int = 0
    syn: bool = False
    fin: bool = False
    rst: bool = False
    ack: bool = False
    psh: bool = False
    land: int = 0
    wrong_fragment: int = 0
    urgent: int = 0
    serror: bool = False
    rerror: bool = False


def canonical_key(ip: Any, l4: Any, proto: str) -> tuple[str, int, str, int, str] | None:
    if proto == "tcp":
        a = (ip.src, int(l4.sport), ip.dst, int(l4.dport), "tcp")
        b = (ip.dst, int(l4.dport), ip.src, int(l4.sport), "tcp")
    elif proto == "udp":
        a = (ip.src, int(l4.sport), ip.dst, int(l4.dport), "udp")
        b = (ip.dst, int(l4.dport), ip.src, int(l4.sport), "udp")
    else:
        a = (ip.src, 0, ip.dst, 0, "icmp")
        b = (ip.dst, 0, ip.src, 0, "icmp")
    return min(a, b), max(a, b)


def build_flows(packets: list[Any]) -> dict[tuple, FlowRecord]:
    flows: dict[tuple, FlowRecord] = {}

    for pkt in packets:
        if not pkt.haslayer(IP):
            continue

        ip = pkt[IP]
        ts = float(pkt.time)
        proto = "icmp" if pkt.haslayer(ICMP) else "tcp" if pkt.haslayer(TCP) else "udp" if pkt.haslayer(UDP) else None
        if proto is None:
            continue

        l4 = pkt[TCP] if proto == "tcp" else pkt[UDP] if proto == "udp" else pkt[ICMP]
        key_pair = canonical_key(ip, l4, proto)
        if key_pair is None:
            continue
        key_min, key_max = key_pair

        if key_min not in flows:
            src_ip, src_port, dst_ip, dst_port, p = key_min
            service_port = dst_port or src_port
            flows[key_min] = FlowRecord(
                proto=p,
                src_ip=src_ip,
                dst_ip=dst_ip,
                src_port=src_port,
                dst_port=dst_port,
                service=port_to_service(service_port, p),
                start=ts,
                end=ts,
                land=1 if src_ip == dst_ip else 0,
            )

        flow = flows[key_min]
        flow.start = min(flow.start, ts)
        flow.end = max(flow.end, ts)
        pkt_len = int(len(pkt))

        if ip.src == flow.src_ip and (
            (proto != "icmp" and int(l4.sport) == flow.src_port) or proto == "icmp"
        ):
            flow.src_bytes += pkt_len
        else:
            flow.dst_bytes += pkt_len

        if proto == "tcp":
            tcp = pkt[TCP]
            flow.syn = flow.syn or bool(tcp.flags.S)
            flow.fin = flow.fin or bool(tcp.flags.F)
            flow.rst = flow.rst or bool(tcp.flags.R)
            flow.ack = flow.ack or bool(tcp.flags.A)
            flow.psh = flow.psh or bool(tcp.flags.P)
            if tcp.flags.S and not tcp.flags.A:
                flow.serror = True
            if tcp.flags.R and not tcp.flags.S:
                flow.rerror = True

        flow.wrong_fragment = max(flow.wrong_fragment, int(bool(ip.flags.MF)))
        flow.urgent = max(flow.urgent, int(getattr(ip.flags, "urg", 0) or 0))

    return flows


def rate(numerator: int, denominator: int) -> float:
    return round(numerator / denominator, 4) if denominator > 0 else 0.0


def flows_to_rows(flows: dict[tuple, FlowRecord]) -> list[dict[str, Any]]:
    flow_list = list(flows.values())
    by_dst: dict[str, list[FlowRecord]] = defaultdict(list)
    by_src_dst: dict[tuple[str, str], list[FlowRecord]] = defaultdict(list)
    by_dst_service: dict[tuple[str, str], list[FlowRecord]] = defaultdict(list)

    for flow in flow_list:
        by_dst[flow.dst_ip].append(flow)
        by_src_dst[(flow.src_ip, flow.dst_ip)].append(flow)
        by_dst_service[(flow.dst_ip, flow.service)].append(flow)

    rows: list[dict[str, Any]] = []

    for flow in flow_list:
        dst_flows = by_dst[flow.dst_ip]
        src_dst_flows = by_src_dst[(flow.src_ip, flow.dst_ip)]
        dst_srv_flows = by_dst_service[(flow.dst_ip, flow.service)]

        same_service = sum(1 for x in dst_flows if x.service == flow.service)
        diff_service = len(dst_flows) - same_service
        same_src_port = sum(1 for x in dst_flows if x.src_port == flow.src_port)

        srv_serrors = sum(1 for x in dst_flows if x.serror)
        srv_rerrors = sum(1 for x in dst_flows if x.rerror)
        conn_serrors = sum(1 for x in src_dst_flows if x.serror)
        conn_rerrors = sum(1 for x in src_dst_flows if x.rerror)

        if flow.proto == "tcp":
            flag = tcp_kdd_flag(flow.syn, flow.fin, flow.rst, flow.ack, flow.psh)
        else:
            flag = "SF"

        rows.append({
            "duration": max(0, int(round(flow.end - flow.start))),
            "protocol_type": flow.proto,
            "service": flow.service,
            "flag": flag,
            "src_bytes": flow.src_bytes,
            "dst_bytes": flow.dst_bytes,
            "land": flow.land,
            "wrong_fragment": flow.wrong_fragment,
            "urgent": flow.urgent,
            "hot": 0,
            "num_failed_logins": 0,
            "logged_in": 0,
            "num_compromised": 0,
            "root_shell": 0,
            "su_attempted": 0,
            "num_root": 0,
            "num_file_creations": 0,
            "num_shells": 0,
            "num_access_files": 0,
            "num_outbound_cmds": 0,
            "is_host_login": 0,
            "is_guest_login": 0,
            "count": len(src_dst_flows),
            "srv_count": same_service,
            "serror_rate": rate(conn_serrors, len(src_dst_flows)),
            "srv_serror_rate": rate(srv_serrors, len(dst_flows)),
            "rerror_rate": rate(conn_rerrors, len(src_dst_flows)),
            "srv_rerror_rate": rate(srv_rerrors, len(dst_flows)),
            "same_srv_rate": rate(same_service, len(dst_flows)),
            "diff_srv_rate": rate(diff_service, len(dst_flows)),
            "srv_diff_host_rate": 0.0,
            "dst_host_count": len(dst_flows),
            "dst_host_srv_count": len(dst_srv_flows),
            "dst_host_same_srv_rate": rate(len(dst_srv_flows), len(dst_flows)),
            "dst_host_diff_srv_rate": rate(len(dst_flows) - len(dst_srv_flows), len(dst_flows)),
            "dst_host_same_src_port_rate": rate(same_src_port, len(dst_flows)),
            "dst_host_srv_diff_host_rate": 0.0,
            "dst_host_serror_rate": rate(srv_serrors, len(dst_flows)),
            "dst_host_srv_serror_rate": rate(srv_serrors, len(dst_flows)),
            "dst_host_rerror_rate": rate(srv_rerrors, len(dst_flows)),
            "dst_host_srv_rerror_rate": rate(srv_rerrors, len(dst_flows)),
        })

    return rows


def pcap_path_to_rows(pcap_path: str, max_packets: int | None = None) -> list[dict[str, Any]]:
    """Read a PCAP/PCAPNG file and return NSL-KDD-style row dicts."""
    packets = list(rdpcap(pcap_path))
    if max_packets:
        packets = packets[:max_packets]

    if not packets:
        raise ValueError("No packets found in capture.")

    flows = build_flows(packets)
    if not flows:
        raise ValueError("No IP flows could be built from this capture.")

    return flows_to_rows(flows)


def write_csv(path: str, rows: list[dict[str, Any]]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FEATURE_NAMES)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert Wireshark PCAP to NSL-KDD-style CSV for IDS upload."
    )
    parser.add_argument("pcap", help="Path to .pcap or .pcapng file")
    parser.add_argument("-o", "--output", default="from_wireshark.csv", help="Output CSV path")
    parser.add_argument("--max-packets", type=int, default=None, help="Limit packets read")
    args = parser.parse_args()

    print(f"Reading {args.pcap} ...")
    rows = pcap_path_to_rows(args.pcap, max_packets=args.max_packets)
    write_csv(args.output, rows)

    print(f"Wrote {len(rows)} connection rows to {args.output}")
    print("Upload this file in the IDS app (results are approximate).")


if __name__ == "__main__":
    main()
