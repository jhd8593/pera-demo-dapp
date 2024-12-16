import React, { useState, useEffect } from "react";
import './_game.scss';
import { ChainType } from "../utils/algod/algod";
import { checkWalletForSlugs } from "../utils/algod/assets";
import { SLUGS, Slug } from "./types";
import { SlugImages } from "../assets/images";

interface GameProps {
  accountAddress: string;
  chain: ChainType;
  handleSetLog: (log: string) => void;
}

// Constants
const PERCENTAGE_MULTIPLIER = 100;
const ATTACK_ANIMATION_DURATION = 500; // milliseconds

// Type for image keys
type SlugImageKey = keyof typeof SlugImages;

const Game: React.FC<GameProps> = ({ accountAddress, chain, handleSetLog }) => {
  const [activeSlug, setActiveSlug] = useState<Slug>(SLUGS[0]);
  const [benchSlugs, setBenchSlugs] = useState<Slug[]>(SLUGS.slice(1));
  const [opponentActiveSlug] = useState<Slug>(SLUGS[0]);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasValidSlugs, setHasValidSlugs] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [attackAnimation, setAttackAnimation] = useState<string>("");

  useEffect(() => {
    const verifyWallet = async () => {
      try {
        setIsVerifying(true);
        setVerificationError(null);
        handleSetLog("Verifying wallet contents...");
        
        const hasSlug = await checkWalletForSlugs(accountAddress, chain);
        setHasValidSlugs(hasSlug);
        
        if (!hasSlug) {
          const message = "No Slugs found in wallet. You need to own a Slug to play.";
          handleSetLog(message);
          setVerificationError(message);
        } else {
          handleSetLog("Slug verification successful!");
        }
      } catch (error) {
        console.error('Error verifying wallet:', error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        handleSetLog(`Error verifying wallet: ${errorMessage}`);
        setVerificationError(`Error verifying wallet: ${errorMessage}`);
        setHasValidSlugs(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyWallet();
  }, [accountAddress, chain, handleSetLog]);

  const getHealthPercentage = (slug: Slug) => {
    return `${(slug.health / slug.maxHealth) * PERCENTAGE_MULTIPLIER}%`;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, slug: Slug) => {
    e.dataTransfer.setData('slug', JSON.stringify(slug));
    const draggedElement = e.currentTarget as HTMLElement;
    draggedElement.classList.add('game__card--dragging');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const draggedElement = e.currentTarget as HTMLElement;
    draggedElement.classList.remove('game__card--dragging');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedSlug = JSON.parse(e.dataTransfer.getData('slug')) as Slug;
    const newBenchSlugs = benchSlugs.filter(slug => slug.id !== draggedSlug.id);
    newBenchSlugs.push(activeSlug);
    setBenchSlugs(newBenchSlugs);
    setActiveSlug(draggedSlug);
    handleSetLog(`Switched to ${draggedSlug.name}!`);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('game__card--dragover');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('game__card--dragover');
  };

  const handleAttack = (attackName: string) => {
    setAttackAnimation("attack-flash");
    handleSetLog(`Used ${attackName}!`);
    setTimeout(() => setAttackAnimation(""), ATTACK_ANIMATION_DURATION);
  };

  const renderAbilityButton = (attack: any, isOpponent: boolean = false) => (
    <button 
      key={attack.name}
      className={`game__ability game__ability--${attack.name.toLowerCase().replace(' ', '-')}`}
      onClick={() => !isOpponent && handleAttack(attack.name)}
      disabled={isOpponent}>
      <div className="game__ability-content">
        <span className="game__ability-name">{attack.name}</span>
        <span className="game__ability-stat">Damage: {attack.damage}</span>
      </div>
      <div className="game__ability-glow"></div>
    </button>
  );

  if (isVerifying) {
    return (
      <div className="game game--loading">
        <div className="game__message">
          <p>Verifying wallet contents...</p>
          <p className="game__debug">Wallet address: {accountAddress}</p>
          <p className="game__debug">Network: {chain}</p>
        </div>
      </div>
    );
  }

  if (!hasValidSlugs) {
    return (
      <div className="game game--error">
        <div className="game__message">
          <h2>Access Denied</h2>
          <p>{verificationError || "You need to own at least one Slug NFT to play this game."}</p>
          <p>Visit the marketplace to get your Slug and join the battle!</p>
          <div className="game__debug-section">
            <p className="game__debug">Wallet address: {accountAddress}</p>
            <p className="game__debug">Network: {chain}</p>
            <p className="game__debug">Please check the browser console for detailed information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game">
      <div className="game__battlefield">
        <div className="game__side game__side--player">
          <div className="game__active-section">
            <div 
              className={`game__card game__card--active`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <img src={SlugImages[activeSlug.image as SlugImageKey]} alt={activeSlug.name} />
              <div className="game__health-container">
                <div className="game__health-bar">
                  <div 
                    className="game__health-fill" 
                    style={{ width: getHealthPercentage(activeSlug) }}
                  ></div>
                </div>
                <div className="game__health-text">
                  {activeSlug.health}/{activeSlug.maxHealth}
                </div>
              </div>
            </div>
            <div className="game__abilities">
              {activeSlug.attacks.map(attack => renderAbilityButton(attack))}
            </div>
          </div>

          <div className="game__bench">
            <div className="game__bench-cards">
              {benchSlugs.map((slug) => (
                <div 
                  key={slug.id} 
                  className="game__card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, slug)}
                  onDragEnd={handleDragEnd}
                >
                  <img src={SlugImages[slug.image as SlugImageKey]} alt={slug.name} />
                  <div className="game__health-container">
                    <div className="game__health-bar">
                      <div 
                        className="game__health-fill" 
                        style={{ width: getHealthPercentage(slug) }}
                      ></div>
                    </div>
                    <div className="game__health-text">
                      {slug.health}/{slug.maxHealth}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="game__side game__side--opponent">
          <div className="game__active-section">
            <div className={`game__card game__card--active ${attackAnimation}`}>
              <img src={SlugImages[opponentActiveSlug.image as SlugImageKey]} alt={opponentActiveSlug.name} />
              <div className="game__health-container">
                <div className="game__health-bar">
                  <div 
                    className="game__health-fill" 
                    style={{ width: getHealthPercentage(opponentActiveSlug) }}
                  ></div>
                </div>
                <div className="game__health-text">
                  {opponentActiveSlug.health}/{opponentActiveSlug.maxHealth}
                </div>
              </div>
            </div>
            <div className="game__abilities">
              {opponentActiveSlug.attacks.map(attack => renderAbilityButton(attack, true))}
            </div>
          </div>

          <div className="game__bench">
            <div className="game__bench-cards">
              <div className="game__card game__card--face-down">
                <img src={SlugImages['Back_Card.png']} alt="Face Down Card" />
              </div>
              <div className="game__card game__card--face-down">
                <img src={SlugImages['Back_Card.png']} alt="Face Down Card" />
              </div>
              <div className="game__card game__card--face-down">
                <img src={SlugImages['Back_Card.png']} alt="Face Down Card" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
