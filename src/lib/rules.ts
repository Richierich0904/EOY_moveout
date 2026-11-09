// The school's rules in one place. The /rules page shows them to students,
// and the AI safety judge is given the same list, so the two can't drift apart.

export const NOT_ALLOWED = [
  "Vapes, e-cigarettes, tobacco or nicotine of any kind",
  "Alcohol, drugs, or anything used to take them",
  "Medicine of any kind, including prescription medicine, painkillers and supplements",
  "Weapons, knives, fireworks, lighters, or anything made to hurt someone",
  "Fake IDs, test answers, homework, essays or anything that breaks the honour code",
  "Anything that isn't yours, or that belongs to the school",
  "Food or drink that has been opened, and anything past its date",
  "Services, favours, dares, or anything that isn't an actual item",
  "Anything else the school's rules don't allow you to have",
] as const;

export const BE_KIND = [
  "Use your real name and keep your profile photo school-appropriate.",
  "Photos show the item only. No people in listing photos.",
  "Describe things honestly, including what's broken or missing.",
  "Be kind in messages. No pressure, teasing, or asking for personal details.",
  "Don't pass things back and forth just to collect points. Handoffs between the same two people stop counting.",
  "If someone says no, or stops replying, leave it there.",
] as const;
