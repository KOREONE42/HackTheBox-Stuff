# List of hexadecimal encoded segments
hex_segments = ["6f722f5c645d4b57", "794066732c6b2c73", "406c6c2c732c732e", 
                "732e6b6c406b6a7d", "6b7c2c6b2c7b4073", "2c737d2b", "62"]

# Initialize empty string to store decoded message
decoded_message = ''

# Process each hexadecimal segment
for hex_segment in hex_segments:
    # Convert hexadecimal string to byte sequence
    byte_sequence = bytes.fromhex(hex_segment)
    
    # Decode bytes by reversing order and applying XOR with 0x1f
    # Convert each resulting byte to its character representation
    decoded_message += ''.join(chr(byte_value ^ 0x1f) for byte_value in byte_sequence[::-1])

# Output the final decoded message
print(decoded_message)