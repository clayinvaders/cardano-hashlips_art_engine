const simplifyTraits = (traits) => {
  const simpleTraits = {};
  traits.forEach((trait) => {
    simpleTraits[trait.layer] = trait.name;
  });
  return simpleTraits;
};

const traitHasDefinedIncompatibilities = (newTrait, incompatibleTraits) => {
  const traitKey = `${newTrait.layer}/${newTrait.name}`;
  return incompatibleTraits[traitKey];
};

const incompatibleTraitsUsed = (newTraits, incompatibleTraits) => {
  if (!incompatibleTraits) {
    return false;
  }

  let usedTraits = [];
  const simpleNewTraits = simplifyTraits(newTraits);

  for (let i = 0; i < newTraits.length; i++) {
    if (
      newTraits[i].name !== "None" &&
      usedTraits.includes(newTraits[i].name)
    ) {
      console.log(`Repeated trait ${newTraits[i].name}`);
      return true;
    } else {
      usedTraits.push(newTraits[i].name);
    }
    const definedIncompatibilities = traitHasDefinedIncompatibilities(
      newTraits[i],
      incompatibleTraits
    );
    if (definedIncompatibilities !== undefined) {
      for (let n = 0; n < definedIncompatibilities.length; n++) {
        const [layer, trait] = definedIncompatibilities[n].split("/");
        if (simpleNewTraits[layer] === trait) {
          console.log(
            `Incompatibe trait ${newTraits[i].layer}/${newTraits[i].name} => ${layer}/${trait}`
          );
          return true;
        } else {
        }
      }
    }
  }
  return false;
};

module.exports = {
  incompatibleTraitsUsed,
};
