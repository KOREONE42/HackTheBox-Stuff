import torch
import torch.nn as nn
import numpy as np
import os
import pickle

class net(nn.Module):
    """Exact network architecture from challenge"""
    def __init__(self):
        super(net, self).__init__()
        self.layer1 = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=3, padding=0, stride=2),
            nn.ReLU(),
            nn.MaxPool2d(2)
        )
        self.layer2 = nn.Sequential(
            nn.Conv2d(16, 32, kernel_size=3, padding=0, stride=2),
            nn.ReLU(),
            nn.MaxPool2d(2)
        )
        self.fc1 = nn.Linear(5408, 10)
        self.fc2 = nn.Linear(10, 2)
        self.relu = nn.ReLU()

    def forward(self, x):
        out = self.layer1(x)
        out = self.layer2(out)
        out = out.view(out.size(0), -1)
        out = self.relu(self.fc1(out))
        out = self.fc2(out)
        out = torch.softmax(out, dim=1)
        return out

def load_model(model_path):
    """Load the pre-trained model"""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at: {model_path}")
        
    device = torch.device('cpu')
    try:
        print("Attempting to load full model (unsafe mode)...")
        model = torch.load(model_path, map_location=device, weights_only=False)
        print("Successfully loaded full model")
    except Exception as e:
        print(f"Model load failed: {str(e)}")
        raise
    
    model.eval()
    for param in model.parameters():
        param.requires_grad = False
    return model

class ReverseNet(nn.Module):
    """Network to generate inputs for the original model"""
    def __init__(self, original_model, input_size=(224, 224)):
        super(ReverseNet, self).__init__()
        self.input_size = input_size
        self.fc = nn.Linear(2, input_size[0] * input_size[1])
        self.original_model = original_model

    def forward(self, x):
        x = self.fc(x)
        x = x.view(-1, 1, *self.input_size)
        return self.original_model(x)

def train_reverse_model(reverse_model, target_output, epochs=5000, lr=0.0005):
    """Train the reverse model to generate desired inputs"""
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(reverse_model.fc.parameters(), lr=lr)
    target_output = target_output.to(dtype=torch.float32)
    
    for epoch in range(epochs):
        optimizer.zero_grad()
        output = reverse_model(target_output)
        loss = criterion(output, target_output)
        loss.backward()
        optimizer.step()
        
        if epoch % 100 == 0:
            print(f"Epoch {epoch}/{epochs}, Loss: {loss.item():.6f}")
            print(f"Output: {output.detach().numpy()}")
    
    return reverse_model

def main():
    # Configuration
    model_path = "/home/kore/Downloads/model.pth"
    input_size = (224, 224)
    # !!!CHANGE 0.1717, 0.8283 in line 90 with your parameters!!!
    target_output = torch.tensor([[0.1717, 0.8283]], dtype=torch.float32) 
    
    try:
        print(f"PyTorch version: {torch.__version__}")
        print(f"Attempting to load model from: {model_path}")
        model = load_model(model_path)
        
        # Test model with correct input size
        dummy_input = torch.zeros(1, 1, *input_size)
        with torch.no_grad():
            test_output = model(dummy_input)
            print(f"Model output shape: {test_output.shape}")
            print(f"Dummy output: {test_output.numpy()}")

        # Train reverse model
        reverse_model = ReverseNet(model, input_size)
        reverse_model = train_reverse_model(reverse_model, target_output)
        
        # Generate and save result
        with torch.no_grad():
            final_output = reverse_model(target_output)
            generated_input = reverse_model.fc(target_output)
            # Save without channel dimension, as expected by the challenge
            generated_input = generated_input.view(*input_size).numpy()
            
            print(f"Generated input shape: {generated_input.shape}")
            print(f"Final output: {final_output.numpy()}")
            accuracy = 1 - torch.mean(torch.abs(final_output - target_output)).item()
            print(f"Accuracy: {accuracy*100:.4f}%")
            if accuracy < 0.9999:
                print("Warning: Accuracy is below 99.99%. You may need to increase epochs or adjust learning rate.")
        
        np.save("generated_input.npy", generated_input)
        print("Generated input saved as 'generated_input.npy'")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()