#!/usr/bin/env sage
# server.sage

import sys

p = 21214334341047589034959795830530169972304000967355896041112297190770972306665257150126981587914335537556050020788061
a = 408179155510362278173926919850986501979230710105776636663982077437889191180248733396157541580929479690947601351140
b = 8133402404274856939573884604662224089841681915139687661374894548183248327840533912259514444213329514848143976390134

Fp = GF(p)
E = EllipticCurve(Fp, [a, b])

# Define base point G
x_G = 10754634945965100597587232538382698551598951191077578676469959354625325250805353921972302088503050119092675418338771
G = E.lift_x(Fp(x_G))

# Read x_A from netcat input
try:
    x_A = int(sys.stdin.readline().strip())
    A = E.lift_x(Fp(x_A))
    
    # Solve for d using discrete logarithm
    d = G.discrete_log(A)

    # ✅ Verification Step
    computed_A = d * G  # Compute d * G
    if computed_A == A:
        print(f"d = {d}")
        print("✅ Verification passed! d is correct.")
    else:
        print("❌ Verification failed! d is incorrect.")

except Exception as e:
    print(f"Error: {e}")