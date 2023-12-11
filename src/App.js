import React, { useState } from "react";

const staticSalt = crypto.getRandomValues(new Uint8Array(16));

const deriveKeyFromPassword = async (password, salt) => {
  try {
    const importedKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      importedKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    return derivedKey;
  } catch (error) {
    console.error("Key derivation failed:", error);
    throw error;
  }
};

const encryptFile = async (fileContent, password) => {
  try {
    const salt = staticSalt;
    const key = await deriveKeyFromPassword(password, salt);

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const algorithm = { name: "AES-GCM", iv };

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      await crypto.subtle.exportKey("raw", key),
      algorithm,
      false,
      ["encrypt"]
    );

    const encryptedData = await crypto.subtle.encrypt(
      algorithm,
      cryptoKey,
      fileContent
    );

    const encryptedFile = new Uint8Array(iv.length + encryptedData.byteLength);
    encryptedFile.set(iv, 0);
    encryptedFile.set(new Uint8Array(encryptedData), iv.length);

    return encryptedFile;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw error;
  }
};

const decryptFile = async (encryptedFile, password) => {
  try {
    const salt = staticSalt;
    const key = await deriveKeyFromPassword(password, salt);

    const iv = encryptedFile.slice(0, 16);
    const algorithm = { name: "AES-GCM", iv };

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      await crypto.subtle.exportKey("raw", key),
      algorithm,
      false,
      ["decrypt"]
    );

    const decryptedData = await crypto.subtle.decrypt(
      algorithm,
      cryptoKey,
      encryptedFile.slice(16)
    );

    return decryptedData;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw error;
  }
};

const App = () => {
  const [file, setFile] = useState(null);
  const [encryptedFile, setEncryptedFile] = useState(null);
  const [decryptedFile, setDecryptedFile] = useState(null);
  const [password, setPassword] = useState("");
  const [decryptPassword, setDecryptPassword] = useState(""); // Added input field for decryption password

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleDecryptPasswordChange = (event) => {
    setDecryptPassword(event.target.value);
  };

  const handleEncrypt = async () => {
    if (file && password) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = new Uint8Array(event.target.result);
        const encryptedFile = await encryptFile(fileContent, password);
        setEncryptedFile(encryptedFile);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Please select a file and enter a password.");
    }
  };

  const handleDecrypt = async () => {
    if (encryptedFile && decryptPassword) {
      try {
        const decryptedData = await decryptFile(encryptedFile, decryptPassword);
        setDecryptedFile(new Blob([decryptedData], { type: "application/pdf" }));
      } catch (error) {
        console.error("Decryption failed:", error);
        alert("Decryption failed. Incorrect password or corrupted file.");
      }
    } else {
      alert("Please provide an encrypted file and enter the decryption password.");
    }
  };

  return (
    <div>
      <h2>File Encryptor and Decryptor</h2>
      <input type="file" onChange={handleFileChange} />
      <br />
      <label>
        Enter password for encryption:
        <input type="password" placeholder="Enter password" onChange={handlePasswordChange} />
      </label>
      <br />
      <button onClick={handleEncrypt}>Encrypt File</button>
      <br />
      <label>
        Enter password for decryption:
        <input type="password" placeholder="Enter decryption password" onChange={handleDecryptPasswordChange} />
      </label>
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
