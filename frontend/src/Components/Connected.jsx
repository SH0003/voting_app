import React from "react";
import "../Css/Connected.css";

const Connected = (props) => {
    return (
        <div className="connected-container">
            <h1 className="connected-header">Welcome to MetaMask</h1>
            <p className="connected-account">
                Time : {props.remainingTime}
            </p>
            {props.showButton ? (
                <p className="connected-account">You have already voted</p>
            ) : (
                <div>

                </div>
            )}

            <div className="candidates-grid">
                {props.candidates.map((candidate, index) => (
                    <div key={index} className="candidate-card">
                        <img
                            className="image"
                            alt={`Uploaded #${index + 1}`}
                            src={candidate.image}
                        />
                        <div className="candidate-details">
                            <h2>{candidate.name}</h2>
                            <p>Votes: {candidate.voteCount}</p>
                            <div className="vote-progress-bar">
                                <div
                                    className={`progress-bar-text progress-${
                                        candidate.voteCount > 5
                                            ? "green"
                                            : candidate.voteCount > 2
                                                ? "yellow"
                                                : "red"
                                    }`}
                                    style={{ width: `${(candidate.voteCount / 10) * 100}%` }}
                                >

                                </div>
                            </div>
                            <div className="candidate-actions">
                                <button className="vote-button" onClick={() => props.voteFunction(index)}>
                                    Vote
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Connected;
