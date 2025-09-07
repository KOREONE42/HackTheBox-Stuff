from Crypto.Hash import SHA256
from Crypto.Signature import PKCS1_v1_5
from Crypto.PublicKey import RSA

UID = "AA369A1D"
username = "axel_5200012"
access_level = "access_level:FFF"

message = f"{username}::{access_level}"
digest = SHA256.new(message.encode("utf-8"))

private_key = RSA.importKey(open("private.pem").read())
signer = PKCS1_v1_5.new(private_key)
sig = signer.sign(digest)

print(UID + "::" + message + "::" + sig.hex())
