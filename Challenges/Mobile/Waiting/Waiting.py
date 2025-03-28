from hashlib import sha256

# Constants
BYTE_KEY = [
    0x71, 0x67, 0x23, 0x4A, 0x23, 0x8, 0x1, 0x1, 0x67, 0x5, 0x41, 0x41, 0x3, 
    0x5B, 0x51, 0x3A, 0x51, 0x5E, 0x17, 0x5C, 0x6A, 0x4D, 0x52, 0x9, 0x48, 0x57, 
    0x14, 0x5, 0x5A, 0x5F, 0x6A, 0x5, 0xC, 0x6, 0x5, 0xD, 0x50, 0x69, 0x5, 0x54, 
    0x55, 0x58, 0x51, 0x7, 0xE, 0x4B, 0x10, 0x18
]
PACKAGE_NAME = 'com.example.waiting'

def log_info(message: str) -> None:
    """Prints informational message with a prefix."""
    print(f"[+] {message}")

def generate_flag(package: str, key: list) -> str:
    """
    Generates a flag by XORing SHA256 hash of package name with a key.
    
    Args:
        package (str): Package name to hash
        key (list): List of bytes for XOR operation
    
    Returns:
        str: Generated flag
    """
    # Generate SHA256 hash and convert to hex
    sha256_hash = sha256(package.encode()).hexdigest()
    
    # XOR each character of hash with corresponding byte from key
    flag = ''.join(chr(ord(sha256_hash[i]) ^ key[i]) for i in range(len(key)))
    return flag

def main():
    """Main function to generate and display the flag."""
    flag = generate_flag(PACKAGE_NAME, BYTE_KEY)
    log_info(f"Flag is {flag}")

if __name__ == '__main__':
    main()