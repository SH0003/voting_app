import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { contractAbi, contractAddress } from "./Constant/constant";
import Login from "./Components/Login";
import Finished from "./Components/Finished";
import Connected from "./Components/Connected";
import "./App.css";

const pinataApiKey = "de27f723de47dc491f1c";
const pinataSecretApiKey = "e01beeb95d3172c3bac68b551f812d6649063ab581b42dc1040e0048f78496ee";

function App() {
    const [provider, setProvider] = useState(null);
    const [account, setAccount] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [votingStatus, setVotingStatus] = useState(true);
    const [remainingTime, setRemainingTime] = useState("");
    const [candidates, setCandidates] = useState([]);
    const [number, setNumber] = useState("");
    const [isAllowedToVote, setIsAllowedToVote] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [newCandidateName, setNewCandidateName] = useState("");
    const [newCandidateImage, setNewCandidateImage] = useState(null);

    useEffect(() => {
        getCandidates();
        getRemainingTime();
        getCurrentStatus();
        if (window.ethereum) {
            window.ethereum.on("accountsChanged", handleAccountsChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            }
        };
    }, []);

    async function vote(candidateIndex) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

        const tx = await contractInstance.vote(candidateIndex);
        await tx.wait();
        checkIfCanVote();
    }

    async function addCandidate() {
        if (!newCandidateName || !newCandidateImage) {
            return alert("Please enter candidate name and select an image");
        }

        try {
            const formData = new FormData();
            formData.append("file", newCandidateImage);

            const metadata = JSON.stringify({
                name: newCandidateImage.name,
                keyvalues: {
                    description: "Candidate image uploaded using Pinata",
                },
            });

            formData.append("pinataMetadata", metadata);
            formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

            const result = await axios.post(
                "https://api.pinata.cloud/pinning/pinFileToIPFS",
                formData,
                {
                    maxBodyLength: "Infinity",
                    headers: {
                        "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
                        pinata_api_key: pinataApiKey,
                        pinata_secret_api_key: pinataSecretApiKey,
                    },
                }
            );

            const imageUrl = `https://gateway.pinata.cloud/ipfs/${result.data.IpfsHash}`;

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

            const tx = await contractInstance.addCandidate(newCandidateName, imageUrl);
            await tx.wait();
            getCandidates();
            setShowPopup(false); // Close the popup after adding the candidate
        } catch (error) {
            console.error("Error uploading image to Pinata:", error);
            alert("Failed to upload image to Pinata");
        }
    }

    async function checkIfCanVote() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
        const voteStatus = await contractInstance.voters(await signer.getAddress());
        setIsAllowedToVote(voteStatus);
    }

    async function getCandidates() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
        const candidatesList = await contractInstance.getAllVotesOfCandidates();
        const formattedCandidates = candidatesList.map((candidate, index) => {
            return {
                index: index,
                name: candidate.name,
                voteCount: candidate.voteCount.toNumber(),
                image: candidate.image,
            };
        });
        setCandidates(formattedCandidates);
    }

    async function getCurrentStatus() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
        const status = await contractInstance.getVotingStatus();
        setVotingStatus(status);
    }

    async function getRemainingTime() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
        const time = await contractInstance.getRemainingTime();
        setRemainingTime(parseInt(time, 16));
    }

    function handleAccountsChanged(accounts) {
        if (accounts.length > 0 && account !== accounts[0]) {
            setAccount(accounts[0]);
            checkIfCanVote();
        } else {
            setIsConnected(false);
            setAccount(null);
        }
    }

    async function connectToMetamask() {
        if (window.ethereum) {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(provider);
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                setAccount(address);
                setIsConnected(true);
                checkIfCanVote();
            } catch (err) {
                console.error(err);
            }
        } else {
            console.error("Metamask is not detected in the browser");
        }
    }

    function handleNumberChange(e) {
        setNumber(e.target.value);
    }

    function handleNewCandidateChange(e) {
        setNewCandidateName(e.target.value);
    }

    function handleNewCandidateImageChange(e) {
        setNewCandidateImage(e.target.files[0]);
    }

    function handleAddCandidateClick() {
        setShowPopup(true);
    }

    function closePopup() {
        setShowPopup(false);
    }

    return (
        <div className="app">
            {votingStatus ? (
                isConnected ? (
                    <div>
                        <Connected
                            account={account}
                            candidates={candidates}
                            remainingTime={remainingTime}
                            number={number}
                            handleNumberChange={handleNumberChange}
                            voteFunction={vote}
                            showButton={isAllowedToVote}
                        />
                        <div className="add-candidate-container">
                            <button onClick={handleAddCandidateClick}>Add Candidate</button>
                        </div>
                        {showPopup && (
                            <div className="popup">
                                <div className="popup-inner">
                                    <h2>Add New Candidate</h2>
                                    <input
                                        type="text"
                                        value={newCandidateName}
                                        onChange={handleNewCandidateChange}
                                        placeholder="Candidate Name"
                                    />
                                    <input type="file" onChange={handleNewCandidateImageChange} />
                                    <button onClick={addCandidate}>Submit</button>
                                    <button onClick={closePopup} className="close-button">Close</button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Login connectWallet={connectToMetamask} />
                )
            ) : (
                <Finished />
            )}
        </div>
    );
}

export default App;
