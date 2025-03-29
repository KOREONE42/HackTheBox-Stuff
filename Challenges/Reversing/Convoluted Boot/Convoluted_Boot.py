from z3 import *
import struct
from typing import List, Tuple

# Constants defined as hex literals for clarity
ORIGINAL_FACTOR = 0xe296df0b
ORIGINAL_CONST = 0x544aa692
FACTOR_KEYS = [
    0xb0796ab2, 0xccddf7bc, 0x16d7ead8,
    0x7289e68, 0xf6804ff8, 0x6ea0855c
]
CONST_KEYS = [
    0x3b3211d, 0x7d2691d5, 0x98ad6bfb,
    0x4a0a9a7a, 0x617e30ed, 0xc28d160b
]

def generate_params() -> Tuple[List[int], List[int]]:
    """Generate factors and constants using XOR operations."""
    factors = [ORIGINAL_FACTOR]
    consts = [ORIGINAL_CONST]
    
    # Using list comprehension for better performance
    for i in range(6):
        factors.append(factors[i] ^ FACTOR_KEYS[i])
        consts.append(consts[i] ^ CONST_KEYS[i])
    
    return factors, consts

def solve_equation(factor: int, const: int) -> bytes:
    """Solve the equation using Z3 solver and return packed result."""
    solver = Solver()
    val = BitVec('val', 32)
    
    # Simplify the equation construction
    temp = val * factor + 0x14800841
    result = 0xa0f27f57 + temp * 0x45f90000 * temp + temp * 0xfd20dcb3
    solver.add(result == const)
    
    if solver.check() != sat:
        raise ValueError("No solution found for given parameters")
    
    # More robust model value extraction
    model_value = solver.model()[val].as_long()
    return struct.pack('I', model_value)

def main():
    """Main execution function."""
    try:
        factors, consts = generate_params()
        # Using bytes.join with generator for efficiency
        result = bytes().join(solve_equation(f, c) for f, c in zip(factors, consts))
        print(result)
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    main()