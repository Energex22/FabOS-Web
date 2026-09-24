# FabVEX Windows firewall

Run Install-FabVex-Firewall.ps1 from an elevated PowerShell prompt on the production PC. It creates only the public web ingress rules required by Caddy: TCP 80 and 443.

The FabOS API listens on 127.0.0.1:8000 and must not have an inbound firewall rule or router port-forward.