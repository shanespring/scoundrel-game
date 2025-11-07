import React, { useState, useEffect } from 'react';

function App() {
  // ---- State ----
  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState([]);
  const [discard, setDiscard] = useState([]);
  const [hp, setHp] = useState(20);
  const [weapon, setWeapon] = useState(null);
  const [weaponLastUsedOn, setWeaponLastUsedOn] = useState(null);
  const [message, setMessage] = useState('Welcome to Scoundrel!');
  const [cardsPlayedThisRoom, setCardsPlayedThisRoom] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [pendingMonsterCard, setPendingMonsterCard] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [canSkip, setCanSkip] = useState(true);

  // ---- Deck and Shuffle ----
  const createDeck = () => {
    let d = [];
    for (let i = 1; i <= 14; i++) d.push({ type: 'monster', value: i }, { type: 'monster', value: i });
    for (let i = 1; i <= 10; i++) d.push({ type: 'potion', value: i }, { type: 'weapon', value: i });
    return shuffle(d);
  };

  const shuffle = (array) => {
    let cur = array.length, rand;
    while (cur !== 0) {
      rand = Math.floor(Math.random() * cur);
      cur--;
      [array[cur], array[rand]] = [array[rand], array[cur]];
    }
    return array;
  };

  // ---- Deal Room ----
  const dealRoom = (currentDeck = deck) => {
    if (currentDeck.length + hand.length < 1) {
      setMessage('You cleared the dungeon! You win!');
      setHand([]);
      return;
    }
    const total = [...hand, ...currentDeck];
    const newHand = total.slice(0, 4);
    const newDeck = total.slice(4);
    setHand(newHand);
    setDeck(newDeck);
    setCardsPlayedThisRoom(0);
    setCanSkip(true);
  };

  useEffect(() => {
    const newDeck = createDeck();
    setDeck(newDeck);
    dealRoom(newDeck); // deal first hand automatically
  }, []);

  // ---- Play Card Logic ----
  const playCardLogic = ({ card, useWeapon }) => {
    let newHp = hp;
    let newWeapon = weapon;
    let msg = '';
    let choiceNeeded = false;

    if (card.type === 'potion') {
      newHp += card.value;
      newHp = Math.min(newHp, 20); // cap HP at 20
      msg = `You drank a potion and healed ${card.value} HP!`;
    } else if (card.type === 'weapon') {
      newWeapon = card;
      msg = `You equipped a weapon of value ${card.value}!`;
    } else if (card.type === 'monster') {
      if (useWeapon === undefined) choiceNeeded = true;
      else {
        const weaponValue = weapon ? weapon.value : 0;
        const damage = useWeapon ? Math.max(card.value - weaponValue, 0) : card.value;
        newHp -= damage;
        msg = useWeapon
          ? `You used your weapon and took ${damage} damage!`
          : `You took ${damage} damage!`;
      }
    }

    const newHand = hand.filter(c => c !== card);
    let newDiscard = [...discard, card];
    let newCardsPlayed = cardsPlayedThisRoom + 1;
    let dealNextRoom = false;

    if (newCardsPlayed >= 3) {
      if (newHand.length > 0) newDiscard = [...newDiscard, ...newHand];
      newCardsPlayed = 0;
      dealNextRoom = true;
    }

    return { newHp, newWeapon, newHand, newDiscard, newCardsPlayed, msg, dealNextRoom, choiceNeeded };
  };

  const playCard = (card) => {
    if (gameOver) return;

    const result = playCardLogic({ card });

    if (result.choiceNeeded) {
      setPendingMonsterCard(card);
      setMessage('A monster! Do you want to use your weapon or take full damage?');
      return;
    }

    setHp(result.newHp);
    setWeapon(result.newWeapon);
    setHand(result.newHand);
    setDiscard(result.newDiscard);
    setCardsPlayedThisRoom(result.newCardsPlayed);
    setMessage(result.msg);

    if (card.type === 'weapon') setWeaponLastUsedOn(null);

    if (result.newHp <= 0) setGameOver(true);
    if (result.dealNextRoom) dealRoom();
  };

  const resolveMonster = (useWeapon) => {
    if (!pendingMonsterCard) return;

    if (useWeapon && weaponLastUsedOn !== null && pendingMonsterCard.value >= weaponLastUsedOn) {
      setMessage(`Your weapon is too “tired” to use on this monster!`);
      useWeapon = false;
    }

    const result = playCardLogic({ card: pendingMonsterCard, useWeapon });

    if (useWeapon) setWeaponLastUsedOn(pendingMonsterCard.value);

    setHp(result.newHp);
    setWeapon(result.newWeapon);
    setHand(result.newHand);
    setDiscard(result.newDiscard);
    setCardsPlayedThisRoom(result.newCardsPlayed);
    setMessage(result.msg);
    setPendingMonsterCard(null);

    if (result.newHp <= 0) setGameOver(true);
    if (result.dealNextRoom) dealRoom();
  };

  const runRoom = () => {
    if (gameOver || !canSkip) return;

    const shuffledDeck = shuffle([...deck, ...hand]);
    setDeck(shuffledDeck);

    const newHand = shuffledDeck.slice(0, 4);
    setHand(newHand);
    setDeck(shuffledDeck.slice(4));

    setCardsPlayedThisRoom(0);
    setMessage('You skipped to the next room!');
    setCanSkip(false);
  };

  // ---- Card Display Helpers ----
  const cardColor = (card) => {
    if (card.type === 'potion') return 'plum';
    if (card.type === 'weapon') return 'lightblue';
    if (card.type === 'monster') return 'lightcoral';
    return 'lightgray';
  };
  const cardIcon = (card) => {
    if (card.type === 'potion') return '🧪';
    if (card.type === 'weapon') return '⚔️';
    if (card.type === 'monster') return '👹';
    return '';
  };
  const cardLabel = (card) => {
    if (card.type === 'potion') return `Potion ${card.value}`;
    if (card.type === 'weapon') return `Weapon ${card.value}`;
    if (card.type === 'monster') return `Monster ${card.value}`;
    return card.value;
  };

  // ---- Render ----
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: 'linear-gradient(to bottom, #2b1b0f, #4b3621)',
      backgroundSize: 'cover',
      color: 'white'
    }}>
      {gameOver ? (
        <div style={{ marginTop: '50px' }}>
          <div style={{
            display: 'inline-block',
            padding: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #442c2e, #8b3e3e)',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            border: '2px solid #fff'
          }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Game Over</h1>
            <p style={{ fontSize: '20px', marginBottom: '30px' }}>Your HP dropped to 0!</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#ff4d6d',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              Restart Game
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
            <div style={{
              padding: '10px 15px', borderRadius: '8px', backgroundColor: 'plum',
              display: 'flex', alignItems: 'center', fontSize: '18px', minWidth: '120px', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '24px', marginRight: '8px' }}>❤️</span>
              <span>{hp} / 20 HP</span>
            </div>
            <div style={{
              padding: '10px 15px', borderRadius: '8px', backgroundColor: 'lightblue',
              display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px'
            }}>
              {weapon ? <>
                <span style={{ fontSize: '24px' }}>⚔️</span>
                <div>Weapon: {weapon.value}</div>
                {weaponLastUsedOn !== null && <div>Last used on: {weaponLastUsedOn}</div>}
              </> : <div style={{ fontStyle: 'italic', color: '#555' }}>No weapon</div>}
            </div>
          </div>

          {/* Updated Deck Count */}
          <p>Cards left: {deck.length + hand.length}</p>
          <p>{message}</p>

          {/* Monster prompt */}
          {pendingMonsterCard && (
            <div style={{ marginTop: '20px' }}>
              <h3>A monster appears!</h3>
              <div style={{
                padding: '20px', border: '2px solid red', borderRadius: '8px', width: '120px', margin: '0 auto', backgroundColor: 'lightcoral', textAlign: 'center', fontSize: '16px',
              }}>
                <span style={{ fontSize: '40px' }}>👹</span>
                <div>Monster {pendingMonsterCard.value}</div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={() => resolveMonster(true)}
                  style={{
                    marginRight: '10px',
                    padding: '8px 12px',
                    cursor: (!weapon || (weaponLastUsedOn !== null && pendingMonsterCard.value >= weaponLastUsedOn)) ? 'not-allowed' : 'pointer',
                    opacity: !weapon ? 0.5 : 1,
                  }}
                  disabled={!weapon || (weaponLastUsedOn !== null && pendingMonsterCard.value >= weaponLastUsedOn)}
                >
                  Use Weapon
                </button>
                <button
                  onClick={() => resolveMonster(false)}
                  style={{ padding: '8px 12px', cursor: 'pointer' }}
                >
                  Take Full Damage
                </button>
              </div>
              {weaponLastUsedOn !== null && pendingMonsterCard.value >= weaponLastUsedOn && (
                <p style={{ color: 'red', marginTop: '10px' }}>Your weapon is too “tired” to use on this monster!</p>
              )}
            </div>
          )}

          {/* Hand */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
            {hand.map((card, idx) => (
              <div
                key={idx}
                onClick={() => pendingMonsterCard ? null : playCard(card)}
                style={{
                  padding: '10px 15px', border: '1px solid black', borderRadius: '5px', cursor: pendingMonsterCard ? 'not-allowed' : 'pointer',
                  backgroundColor: cardColor(card), display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '16px', opacity: pendingMonsterCard ? 0.5 : 1
                }}
              >
                <span style={{ fontSize: '30px' }}>{cardIcon(card)}</span>
                <span>{cardLabel(card)}</span>
              </div>
            ))}
          </div>

          {/* Skip Room */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button
              onClick={runRoom}
              style={{
                padding: '10px 20px',
                maxWidth: '200px',
                width: '100%',
                borderRadius: '8px',
                border: 'none',
                background: canSkip && cardsPlayedThisRoom === 0 && !pendingMonsterCard
                  ? 'linear-gradient(90deg, #6a11cb, #2575fc)'
                  : '#555',
                color: 'white',
                fontWeight: 'bold',
                cursor: canSkip && cardsPlayedThisRoom === 0 && !pendingMonsterCard ? 'pointer' : 'not-allowed',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s, background 0.3s',
              }}
              disabled={!canSkip || cardsPlayedThisRoom > 0 || pendingMonsterCard !== null}
              onMouseOver={(e) => {
                if (canSkip && cardsPlayedThisRoom === 0 && !pendingMonsterCard)
                  e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Skip Room
            </button>
          </div>
          {(cardsPlayedThisRoom > 0 || pendingMonsterCard) && (
            <p style={{ color: 'red', marginTop: '5px' }}>You can’t skip this room after starting a fight!</p>
          )}

          {/* Rules Toggle */}
          <div style={{ marginTop: '30px' }}>
            <button onClick={() => setShowRules(!showRules)} style={{ padding: '8px 15px', cursor: 'pointer' }}>
              {showRules ? 'Hide Rules' : 'Show Rules'}
            </button>
          </div>
          {showRules && (
            <div style={{
              marginTop: '20px', textAlign: 'left', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', color: '#000'
            }}>
              <h2>Game Rules</h2>
              <ul>
                <li>Start with 20 HP.</li>
                <li>Each room gives you 4 cards to play.</li>
                <li>Play potions to heal (max 20 HP).</li>
                <li>Equip weapons to fight monsters. Weapon can't reuse on equal/higher value monster.</li>
                <li>Monsters deal damage equal to their value, reduced by weapon if used.</li>
                <li>After playing 3 cards in a room, the room ends and a new room is dealt.</li>
                <li>You may skip the room before playing any cards, not after starting a fight.</li>
                <li>Remaining unplayed cards carry over to the next room.</li>
                <li>Clear all rooms to win the game!</li>
              </ul>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <p style={{ marginTop: '40px', fontSize: '12px', color: '#aaa' }}>Created by Shane Spring</p>
    </div>
  );
}

export default App;
