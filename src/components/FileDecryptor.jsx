import React, { useEffect, useState } from 'react'
import encryptedFile from "../components/encrypted_file.txt";
import Logo from "../components/logo192.png"
const staticSalt = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

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

const FileDecryptor = () => {

    console.log(encryptedFile, Logo)
    const [decryptPassword, setDecryptPassword] = useState("")
    const [decryptedFile, setDecryptedFile] = useState(null);
    const [arrayBuffer, setArrayBuffer] = useState(null);

    const handleDecryptPasswordChange = (event) => {
        setDecryptPassword(event.target.value);
    };

    const handleDecrypt = async () => {
        console.log(arrayBuffer, decryptPassword)
        if (arrayBuffer && decryptPassword) {
            try {
                const decryptedData = await decryptFile(arrayBuffer, decryptPassword);
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

    const handleFile = (event) => {
        const file = event.target.files[0];
    
        if (file) {
          const reader = new FileReader();
    
          reader.onload = function (e) {
            const resultArrayBuffer = e.target.result;
            setArrayBuffer(resultArrayBuffer);
          };
    
          reader.readAsArrayBuffer(file);
        }
      };

    return (
        <div>
              <input type="file" onChange={handleFile} />
            <div>
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
            </div>
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
        </div>
    )
}

export default FileDecryptor