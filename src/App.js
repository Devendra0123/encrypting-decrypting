import React, { useState } from "react";

const staticKey = crypto.getRandomValues(new Uint8Array(32));

const encryptFile = async (fileContent) => {
  try {
    // Generate a random initialization vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(16));

    // Create an algorithm object with the AES-GCM algorithm and the key
    const algorithm = { name: "AES-GCM", iv };
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      staticKey,
      algorithm,
      false,
      ["encrypt"]
    );

    // Encrypt the file data
    const encryptedData = await crypto.subtle.encrypt(
      algorithm,
      cryptoKey,
      fileContent
    );

    // Combine the IV and encrypted data into a single array
    const encryptedFile = new Uint8Array(iv.length + encryptedData.byteLength);
    encryptedFile.set(iv, 0);
    encryptedFile.set(new Uint8Array(encryptedData), iv.length);

    return encryptedFile;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw error; // rethrow the error for better debugging
  }
};

const decryptFile = async (encryptedFile) => {
  try {
    // Extract the IV from the beginning of the encrypted data
    const iv = encryptedFile.slice(0, 16);

    // Create an algorithm object with the AES-GCM algorithm and the key
    const algorithm = { name: "AES-GCM", iv };
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      staticKey,
      algorithm,
      false,
      ["decrypt"]
    );

    // Decrypt the file data (excluding the IV)
    const decryptedData = await crypto.subtle.decrypt(
      algorithm,
      cryptoKey,
      encryptedFile.slice(16)
    );

    return decryptedData;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw error; // rethrow the error for better debugging
  }
};

const App = () => {
  const [file, setFile] = useState(null);
  const [encryptedFile, setEncryptedFile] = useState(null);
  const [decryptedFile, setDecryptedFile] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleEncrypt = async () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = new Uint8Array(event.target.result);
        const encryptedFile = await encryptFile(fileContent);
        setEncryptedFile(encryptedFile);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Please select a file.");
    }
  };

  const handleDecrypt = async () => {
    if (encryptedFile) {
      try {
        const decryptedData = await decryptFile(encryptedFile);

        // Set the decrypted Blob as the source for display
        setDecryptedFile(
          new Blob([decryptedData], { type: "application/pdf" })
        );
      } catch (error) {
        console.error("Decryption failed:", error);
      }
    } else {
      alert("Please provide an encrypted file.");
    }
  };

  return (
    <div>
      <h2>File Encryptor and Decryptor</h2>
      <input type="file" onChange={handleFileChange} />
      <br />
      <button onClick={handleEncrypt}>Encrypt File</button>
      <br />
      <button onClick={handleDecrypt}>Decrypt File</button>
      <br />
      {encryptedFile && (
        <div>
          <h3>Encrypted File:</h3>
          <a
            href={URL.createObjectURL(new Blob([encryptedFile]))}
            download="encrypted_file"
          >
            Download Encrypted File
          </a>
        </div>
      )}
      {decryptedFile && (
        <div>
          <h3>Decrypted File:</h3>
          <iframe
            title="Decrypted File"
            src={URL.createObjectURL(decryptedFile)}
            width="100%"
            height="600px"
          ></iframe>
        </div>
      )}
      {/* for Image
      {decryptedFile && (
        <div>
          <h3>Decrypted File:</h3>
          <img
            alt="Decrypted File"
            src={URL.createObjectURL(decryptedFile)}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
      )} */}
      {decryptedFile && (
        <div>
          <h3>Decrypted File:</h3>
          <a
            href={URL.createObjectURL(decryptedFile)}
            download="decrypted_file"
          >
            Download Decrypted File
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
