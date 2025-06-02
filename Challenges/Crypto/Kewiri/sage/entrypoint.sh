# Create a named pipe (FIFO)
mkfifo /tmp/fifo

# Start listening on port 1337, redirect input to the SageMath script
while true; do
    cat /tmp/fifo | sage /sage/server.sage | nc -l -p 1337 > /tmp/fifo
done