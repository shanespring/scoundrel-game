import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playCardLogic } from './gameLogic';

function App() {
  // Deck creation
  const createDeck = () => {
    let deck = [];

    for (let i = 1; i <= 14; i++) {
      deck.push({ type: 'monster', value: i });
      deck.push({ type: 'monster', value: i }); // two monsters per number
    }

    for (let i = 1; i <= 10; i++) {
      deck.push({ type: 'potion', value: i });
      deck.push({ type: 'weapon', value: i });
    }

    return shuffle(deck);
  };

  const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const [deck, setDeck] = useState(createDeck());
  const [hand, setHand] = useState([]);
  const [discard, setDiscard] = useState([]);
  const [hp, setHp] = useState(20);
  const [weapon, setWeapon] = useState(null);
  const [weaponLastUsedOn, setWeaponLastUsedOn] = useState(null);
  const [message, setMessage] = useState('Welcome to Scoundrel!');
  const [cardsPlayedThisRoom, setCardsPlayedThisRoom] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [pendingMonsterCard, setPendingMonsterCard] = useState(null);
  const [showRules, setShowRules] = useState(false); // toggle rules visibility

  // Deal a room
  const dealRoom = () => {
    if (deck.length + hand.length < 1) {
      setMessage('You cleared the dungeon! You win!');
      setHand([]);
      return;
    }

    // Combine remaining hand with deck
    const totalCards = [...hand, ...deck];
    const newHand = totalCards.slice(0, 4);
    const newDeck = totalCards.slice(4);

    setHand(newHand);
    setDeck(newDeck);
    setCardsPlayedThisRoom(0);
  };

  useEffect(() => {
    dealRoom();
  }, []);

  const playCard = (card) => {
    if (gameOver) return;

    const result = playCardLogic({ card, hand, discard, hp, weapon, cardsPlayedThisRoom });

    if (result.choiceNeeded) {
      setPendingMonsterCard(card);
      setMessage('A monster! Do you want to use your weapon or take full damage?');
      return;
    }

    // Update HP but cap at 20
    setHp(Math.min(result.newHp, 20));

    setWeapon(result.newWeapon);
    setHand(result.newHand);
    setDiscard(result.newDiscard);
    setCardsPlayedThisRoom(result.newCardsPlayed);
    setMessage(result.msg);

    // Reset "last used on" if equipping a weapon
    if (card.type === 'weapon') {
      setWeaponLastUsedOn(null);
    }

    if (result.newHp <= 0) {
      setGameOver(true);
      return;
    }

    if (result.dealNextRoom) {
      dealRoom();
    }
  };

  const resolveMonster = (useWeapon) => {
    if (!pendingMonsterCard) return;

    if (
      useWeapon &&
      weaponLastUsedOn !== null &&
      pendingMonsterCard.value >= weaponLastUsedOn
    ) {
      setMessage(`Your weapon is too “tired” to use on this monster!`);
      useWeapon = false;
    }

    const result = playCardLogic({
      card: pendingMonsterCard,
      hand,
      discard,
      hp,
      weapon,
      cardsPlayedThisRoom,
      useWeapon,
    });

    if (useWeapon) {
      setWeaponLastUsedOn(pendingMonsterCard.value);
    }

    setHp(Math.min(result.newHp, 20));
    setWeapon(result.newWeapon);
    setHand(result.newHand);
    setDiscard(result.newDiscard);
    setCardsPlayedThisRoom(result.newCardsPlayed);
    setMessage(result.msg);
    setPendingMonsterCard(null);

    if (result.newHp <= 0) {
      setGameOver(true);
      return;
    }

    if (result.dealNextRoom) {
      dealRoom();
    }
  };

  const runRoom = () => {
    if (gameOver) return;

    // Keep current hand in deck
    setDeck([...deck, ...hand]);
    setHand([]);
    setCardsPlayedThisRoom(0);
    dealRoom();
    setMessage('You ran to the next room!');
  };

  const cardLabel = (card) => {
    if (card.type === 'potion') return `Potion ${card.value}`;
    if (card.type === 'weapon') return `Weapon ${card.value}`;
    if (card.type === 'monster') return `Monster ${card.value}`;
    return card.value;
  };

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

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      {gameOver ? (
        <div>
          <h1>Game Over</h1>
          <p>Your HP dropped to 0!</p>
          <button onClick={() => window.location.reload()}>Restart Game</button>
        </div>
      ) : (
        <>
          <h1>Scoundrel</h1>
          <p>HP: {hp}</p>
          <p>Cards left in deck: {deck.length}</p>
          {weapon && (
            <p>
              Equipped: {weapon.value} {weaponLastUsedOn !== null && `(Last used on: ${weaponLastUsedOn})`}
            </p>
          )}
          <p>{message}</p>

          {/* Pending monster */}
          {pendingMonsterCard && (
            <div style={{ marginTop: '20px' }}>
              <h3>A monster appears!</h3>
              <motion.div
                key={pendingMonsterCard.value}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                  padding: '20px',
                  border: '2px solid red',
                  borderRadius: '8px',
                  width: '120px',
                  margin: '0 auto',
                  backgroundColor: 'lightcoral',
                  textAlign: 'center',
                  fontSize: '16px',
                }}
              >
                <span style={{ fontSize: '40px' }}>{cardIcon(pendingMonsterCard)}</span>
                <div>{cardLabel(pendingMonsterCard)}</div>
              </motion.div>

              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={() => resolveMonster(true)}
                  style={{ marginRight: '10px', padding: '8px 12px', cursor: 'pointer' }}
                  disabled={
                    weaponLastUsedOn !== null &&
                    pendingMonsterCard.value >= weaponLastUsedOn
                  }
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

              {weaponLastUsedOn !== null &&
                pendingMonsterCard.value >= weaponLastUsedOn && (
                  <p style={{ color: 'red', marginTop: '10px' }}>
                    Your weapon is too “tired” to use on this monster!
                  </p>
                )}
            </div>
          )}

          {/* Player hand */}
          <div
            style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}
          >
            {hand.map((card, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: pendingMonsterCard ? 1 : 1.1 }}
                style={{
                  padding: '10px 15px',
                  border: '1px solid black',
                  borderRadius: '5px',
                  cursor: pendingMonsterCard ? 'not-allowed' : 'pointer',
                  backgroundColor: cardColor(card),
                  opacity: pendingMonsterCard ? 0.5 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  fontSize: '16px',
                }}
                onClick={() => {
                  if (!pendingMonsterCard) playCard(card);
                }}
              >
                <span style={{ fontSize: '30px' }}>{cardIcon(card)}</span>
                <span>{cardLabel(card)}</span>
              </motion.div>
            ))}
          </div>

          {/* Run / Skip Room */}
          <button
            onClick={runRoom}
            style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
            disabled={cardsPlayedThisRoom > 0 || pendingMonsterCard !== null}
          >
            Run / Skip Room
          </button>
          {(cardsPlayedThisRoom > 0 || pendingMonsterCard) && (
            <p style={{ color: 'red', marginTop: '5px' }}>
              You can’t skip this room after starting a fight!
            </p>
          )}

          {/* Toggle Rules */}
          <div style={{ marginTop: '30px' }}>
            <button
              onClick={() => setShowRules(!showRules)}
              style={{ padding: '8px 15px', cursor: 'pointer' }}
            >
              {showRules ? 'Hide Rules' : 'Show Rules'}
            </button>
          </div>

          {showRules && (
            <div
              style={{
                marginTop: '20px',
                textAlign: 'left',
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto',
                padding: '20px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <h2>Game Rules</h2>
              <ul>
                <li>Start with 20 HP.</li>
                <li>Each room gives you 4 cards to play.</li>
                <li>Play potions to heal, but HP cannot exceed 20.</li>
                <li>Equip weapons to fight monsters. A weapon cannot be reused on a monster with value equal to or higher than the last one it was used on.</li>
                <li>Monsters deal damage equal to their value, reduced by your weapon if used.</li>
                <li>After playing 3 cards in a room, the room ends and a new room is dealt.</li>
                <li>You may run to the next room before playing any cards, but not after starting a fight.</li>
                <li>Clear all rooms to win the game!</li>
                <li>Remaining unplayed cards carry over to the next room.</li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
