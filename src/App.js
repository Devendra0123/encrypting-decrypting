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
        setDecryptedFile(
          new Blob([decryptedData], { type: "application/pdf" })
        );
      } catch (error) {
        console.error("Decryption failed:", error);
        alert("Decryption failed. Incorrect password or corrupted file.");
      }
    } else {
      alert(
        "Please provide an encrypted file and enter the decryption password."
      );
    }
  };

  return (
    <div className="w-screen flex flex-col items-center gap-[10px] mt-[50px]">
      <h2 className="text-xl font-bold underline underline-offset-8">
        File Encryptor and Decryptor
      </h2>
      <input type="file" onChange={handleFileChange} className="mt-[30px]" />
      <br />
      <label>
        Enter password for encryption:
        <input
          type="password"
          placeholder="Enter password"
          onChange={handlePasswordChange}
          className="p-[6px] rounded-[4px] outline-none border border-slate-300 ml-[10px] "
        />
      </label>
      <br />
      <button
        onClick={handleEncrypt}
        className="bg-pink-600 px-[20px] py-[8px] text-white rounded-[10px] "
      >
        Encrypt File
      </button>
      <br />
      <label>
        Enter password for decryption:
        <input
          type="password"
          placeholder="Enter decryption password"
          onChange={handleDecryptPasswordChange}
          className="p-[6px] rounded-[4px] outline-none border border-slate-300 ml-[10px] "
        />
      </label>
      <br />
      <button
        onClick={handleDecrypt}
        className="bg-blue-600 px-[20px] py-[8px] text-white rounded-[10px] "
      >
        Decrypt File
      </button>
      <br />

      <div className="w-screen min-h-[30vh] bg-pink-300 flex items-center justify-evenly p-[20px]">
        {encryptedFile && (
          <div className="flex flex-col gap-[10px]">
            <h3>Encrypted File:</h3>
            <a
              href={URL.createObjectURL(new Blob([encryptedFile]))}
              download="encrypted_file"
              className="bg-red-500 text-white p-[7px]"
            >
              Download Encrypted File
            </a>
          </div>
        )}
        {decryptedFile && (
          <div className="flex flex-col gap-[10px]">
            <h3>Decrypted File:</h3>
            <iframe
              title="Decrypted File"
              src={URL.createObjectURL(decryptedFile)}
              width="500px"
              height="400px"
            ></iframe>
          </div>
        )}
        {decryptedFile && (
          <div className="flex flex-col gap-[10px]">
            <h3>Decrypted File:</h3>
            <a
              href={URL.createObjectURL(decryptedFile)}
              download="decrypted_file"
              className="bg-blue-500 text-white p-[7px]"
            >
              Download Decrypted File
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
