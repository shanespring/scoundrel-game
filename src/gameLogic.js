export const playCardLogic = ({
    card,
    hand,
    discard,
    hp,
    weapon,
    cardsPlayedThisRoom,
    useWeapon,
  }) => {
    let newHp = hp;
    let newWeapon = weapon;
    let msg = '';
    let choiceNeeded = false;
  
    if (card.type === 'potion') {
      const healAmount = Math.min(card.value, 20 - newHp);
      newHp += healAmount;
      msg = `You drank a potion and healed ${healAmount} HP!`;
    } else if (card.type === 'weapon') {
      newWeapon = card;
      msg = `You equipped a weapon of value ${card.value}!`;
    } else if (card.type === 'monster') {
      if (useWeapon === undefined) {
        choiceNeeded = true;
      } else {
        const weaponValue = weapon ? weapon.value : 0;
        const damage = useWeapon ? Math.max(card.value - weaponValue, 0) : card.value;
        newHp -= damage;
        msg = useWeapon
          ? `You used your weapon and took ${damage} damage!`
          : `You took ${damage} damage!`;
      }
    }
  
    const newHand = hand.filter((c) => c !== card);
    let newDiscard = [...discard, card];
    let newCardsPlayed = cardsPlayedThisRoom + 1;
    let dealNextRoom = false;
  
    if (newCardsPlayed >= 3) {
      if (newHand.length > 0) {
        newDiscard = [...newDiscard, ...newHand];
      }
      newCardsPlayed = 0;
      dealNextRoom = true;
    }
  
    return {
      newHp,
      newWeapon,
      newHand,
      newDiscard,
      newCardsPlayed,
      msg,
      dealNextRoom,
      choiceNeeded,
    };
  };
  