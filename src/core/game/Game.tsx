import { useState } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import { ChainType, clientForChain } from "../utils/algod/algod";
import { Attack, SLUGS, Slug } from "./types";
import { SlugImages } from "../assets/images";
import React from 'react';

interface GameProps {
  accountAddress: string | null;
  peraWallet: PeraWalletConnect;
  chain: ChainType;
  handleSetLog: (log: string) => void;
}

// Constants
const SLUG_ASSET_IDS = {
  Daggerpult: 527479654,
  Hailstorm: 527477069,
  Zipacute: 527475282,
  Slugger: 337228921
};
const REQUIRED_SLUGS_COUNT = 3;
const BATTLE_ANIMATION_DURATION = 2000;
const INITIAL_BATTLE_DELAY = 500;
const PERCENTAGE_BASE = 100;
const BATTLE_WIN_CHANCE = 50;

type BattleResult = 'victory' | 'defeat' | 'draw' | null;

interface OwnedSlug extends Slug {
  owned: boolean;
}

function Game({ accountAddress, chain, handleSetLog }: GameProps): JSX.Element {
  const [isSelecting, setIsSelecting] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableSlugs, setAvailableSlugs] = useState<OwnedSlug[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Slug[]>([]);
  const [activeSlugIndex, setActiveSlugIndex] = useState(0);
  const [battleResult, setBattleResult] = useState<BattleResult>(null);
  const [isBattling, setIsBattling] = useState(false);
  const [attackCooldowns, setAttackCooldowns] = useState<{ [key: string]: number }>({});
  const [draggedSlugIndex, setDraggedSlugIndex] = useState<number | null>(null);

  React.useEffect(() => {
    if (accountAddress) {
      checkOwnedSlugs();
    }
  }, [accountAddress]);

  async function checkOwnedSlugs() {
    try {
      const client = clientForChain(chain);
      const accountInfo = await client.accountInformation(accountAddress!).do();
      const assets = accountInfo['assets'] || [];

      const ownedAssetIds = assets.map((asset: any) => 
        Number(asset['asset-id'] || asset['assetId'])
      );

      const slugsWithOwnership = SLUGS.map(slug => ({
        ...slug,
        owned: ownedAssetIds.includes(SLUG_ASSET_IDS[slug.name as keyof typeof SLUG_ASSET_IDS])
      }));

      setAvailableSlugs(slugsWithOwnership);
      handleSetLog(`Found ${slugsWithOwnership.filter(s => s.owned).length} owned slugs`);
    } catch (error) {
      console.error("Error checking owned slugs:", error);
      handleSetLog("Error checking owned slugs");
    }
  }

  function handleSlugSelect(slug: OwnedSlug) {
    if (!slug.owned) {
      handleSetLog(`You don't own ${slug.name}`);
      return;
    }

    if (selectedSlugs.some(s => s.name === slug.name)) {
      setSelectedSlugs(selectedSlugs.filter(s => s.name !== slug.name));
      handleSetLog(`Removed ${slug.name} from selection`);
    } else if (selectedSlugs.length < REQUIRED_SLUGS_COUNT) {
      setSelectedSlugs([...selectedSlugs, slug]);
      handleSetLog(`Added ${slug.name} to selection`);
    } else {
      handleSetLog(`You can only select ${REQUIRED_SLUGS_COUNT} slugs`);
    }
  }

  function handleStartGame() {
    if (selectedSlugs.length === REQUIRED_SLUGS_COUNT) {
      setIsSelecting(false);
      setIsPlaying(true);
      handleSetLog("Battle starting!");
    } else {
      handleSetLog(`Please select ${REQUIRED_SLUGS_COUNT} slugs to start`);
    }
  }

  function handleAttack(attack: Attack) {
    if (isPlaying && !isBattling && !isAttackOnCooldown(attack)) {
      setIsBattling(true);
      setBattleResult(null);

      // Set attack cooldown
      setAttackCooldowns((prev: { [key: string]: number }) => ({
        ...prev,
        [`${activeSlugIndex}-${attack.name}`]: attack.cooldown
      }));

      // Simulate battle result
      setTimeout(() => {
        const result = Math.random() * PERCENTAGE_BASE < BATTLE_WIN_CHANCE ? 'victory' : 'defeat';
        setBattleResult(result);
        handleSetLog(`${result === 'victory' ? 'Victory!' : 'Defeat!'} Used ${attack.name} (${attack.damage} damage)`);

        // Reset after animation
        setTimeout(() => {
          setBattleResult(null);
          setIsBattling(false);

          // Reduce cooldowns
          setAttackCooldowns((prev: { [key: string]: number }) => {
            const updated = { ...prev };
            Object.keys(updated).forEach(key => {
              if (updated[key] > 0) updated[key]--;
            });
            return updated;
          });
        }, BATTLE_ANIMATION_DURATION);
      }, INITIAL_BATTLE_DELAY);
    }
  }

  function isAttackOnCooldown(attack: Attack): boolean {
    return (attackCooldowns[`${activeSlugIndex}-${attack.name}`] || 0) > 0;
  }

  function handleBenchSlugSelect(index: number) {
    if (isPlaying && !isBattling && index !== activeSlugIndex) {
      setActiveSlugIndex(index);
      handleSetLog(`${selectedSlugs[index].name} moved to active position!`);
    }
  }

  function handleDragStart(event: React.DragEvent, index: number) {
    if (!isBattling && index !== activeSlugIndex) {
      setDraggedSlugIndex(index);
      event.dataTransfer.setData('text/plain', index.toString());
      event.currentTarget.classList.add('game__card--dragging');
    }
  }

  function handleDragEnd(event: React.DragEvent) {
    event.currentTarget.classList.remove('game__card--dragging');
    setDraggedSlugIndex(null);
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.currentTarget.classList.add('game__card--drag-over');
  }

  function handleDragLeave(event: React.DragEvent) {
    event.currentTarget.classList.remove('game__card--drag-over');
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    event.currentTarget.classList.remove('game__card--drag-over');
    
    if (draggedSlugIndex !== null) {
      handleBenchSlugSelect(draggedSlugIndex);
    }
  }

  function handleCardKeyPress(event: React.KeyboardEvent, index: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      handleBenchSlugSelect(index);
    }
  }

  function handleDropZoneKeyPress(event: React.KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      if (draggedSlugIndex !== null) {
        handleBenchSlugSelect(draggedSlugIndex);
      }
    }
  }

  function renderHealthBar(current: number, max: number) {
    const percentage = (current / max) * PERCENTAGE_BASE;
    return (
      <div className="game__health-bar">
        <div 
          className="game__health-bar-fill" 
          style={{ width: `${percentage}%` }}
        />
        <span className="game__health-text">{current}/{max}</span>
      </div>
    );
  }

  if (!accountAddress) {
    return (
      <div className="game">
        <div className="game__main-content">
          <section className="game__header">
            <h1 className="game__title">Battle Slugs</h1>
          </section>
          <div className="game__message">Connect your wallet to enter the battlefield</div>
        </div>
      </div>
    );
  }

  if (isSelecting) {
    return (
      <div className="game">
        <div className="game__top-bar">
          <div className="game__top-bar-content">
            <h1 className="game__title">Select Your Slugs</h1>
          </div>
        </div>

        <div className="game__main-content">
          <div className="game__selection-info">
            Selected: {selectedSlugs.length}/{REQUIRED_SLUGS_COUNT}
          </div>
          <div className="game__slug-selection">
            {availableSlugs.map((slug, index) => (
              <button
                key={index}
                className={`game__card ${!slug.owned ? 'game__card--locked' : ''} ${
                  selectedSlugs.some(s => s.name === slug.name) ? 'game__card--selected' : ''
                }`}
                onClick={() => handleSlugSelect(slug)}
                disabled={!slug.owned}
              >
                <div className="game__card-content">
                  <div className="game__card-title">{slug.name}</div>
                  <img 
                    src={SlugImages[slug.image as keyof typeof SlugImages]} 
                    alt={slug.name}
                    className="game__card-image"
                  />
                  {!slug.owned && <div className="game__card-locked">Not Owned</div>}
                </div>
              </button>
            ))}
          </div>
          <button 
            className="game__button"
            onClick={handleStartGame}
            disabled={selectedSlugs.length !== REQUIRED_SLUGS_COUNT}
          >
            Start Battle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game">
      <div className="game__top-bar">
        <div className="game__top-bar-content">
          <h1 className="game__title">Battle Slugs</h1>
        </div>
      </div>

      <div className="game__main-content">
        {!isPlaying ? (
          <section className="game__start-section">
            <button className="game__button" onClick={() => setIsPlaying(true)}>
              Start Game
            </button>
          </section>
        ) : (
          <div className="game__centered-content">
            <section className="game__battle-section">
              <div className="game__battle-zone">
                {battleResult && (
                  <div className={`game__battle-zone-result game__battle-zone-result--${battleResult}`}>
                    {battleResult.toUpperCase()}!
                  </div>
                )}
              </div>
            </section>

            <section className="game__player-section">
              <div className="game__active-slug">
                <h3 className="game__subsection-title game__subsection-title--centered">Active Slug</h3>
                <button 
                  className="game__card game__card--active"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onKeyDown={handleDropZoneKeyPress}
                  tabIndex={0}
                  aria-label="Active slug drop zone"
                >
                  <div className="game__card-content">
                    <div className="game__card-title">{selectedSlugs[activeSlugIndex].name}</div>
                    <img 
                      src={SlugImages[selectedSlugs[activeSlugIndex].image as keyof typeof SlugImages]} 
                      alt={selectedSlugs[activeSlugIndex].name}
                      className="game__card-image"
                    />
                    {renderHealthBar(
                      selectedSlugs[activeSlugIndex].health,
                      selectedSlugs[activeSlugIndex].maxHealth
                    )}
                  </div>
                </button>

                <div className="game__attacks">
                  {selectedSlugs[activeSlugIndex].attacks.map((attack, index) => (
                    <button
                      key={index}
                      className={`game__attack-button ${isAttackOnCooldown(attack) ? 'game__attack-button--cooldown' : ''}`}
                      onClick={() => handleAttack(attack)}
                      disabled={isBattling || isAttackOnCooldown(attack)}
                    >
                      <div className="game__attack-name">{attack.name}</div>
                      <div className="game__attack-damage">Damage: {attack.damage}</div>
                      {isAttackOnCooldown(attack) && (
                        <div className="game__attack-cooldown">
                          Cooldown: {attackCooldowns[`${activeSlugIndex}-${attack.name}`]}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="game__bench">
                <h3 className="game__subsection-title game__subsection-title--centered">Bench Slugs</h3>
                <div className="game__player-area">
                  {selectedSlugs.map((slug, index) => (
                    index !== activeSlugIndex && (
                      <button
                        key={index}
                        className="game__card"
                        onClick={() => handleBenchSlugSelect(index)}
                        onKeyDown={(e) => handleCardKeyPress(e, index)}
                        draggable={!isBattling}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        disabled={isBattling}
                        aria-label={`Select ${slug.name}`}
                      >
                        <div className="game__card-content">
                          <div className="game__card-title">{slug.name}</div>
                          <img 
                            src={SlugImages[slug.image as keyof typeof SlugImages]} 
                            alt={slug.name}
                            className="game__card-image"
                          />
                          {renderHealthBar(slug.health, slug.maxHealth)}
                        </div>
                      </button>
                    )
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default Game;
