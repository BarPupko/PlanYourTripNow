// IVRYTOURS INC — public-site brand palette.
//
// Kept separate from utils/colors.js on purpose: colors.js still drives the
// admin dashboard and the operational modals, which were not part of the
// rebrand. Only the public-facing pages read from here.
export const brand = {
  ink: '#0F1D3A',        // deepest navy — top utility bar, hero ground
  navy: '#16294F',       // headings, stats band, footer
  blue: '#1E396C',       // primary action / links
  blueDeep: '#16294F',   // primary action hover
  red: '#C92A26',        // accent — icons, rules, active language
  redDeep: '#AE221E',    // accent hover
  redMuted: '#8E1F1B',   // sold out
  cream: '#F7F8F3',      // page ground
  creamAlt: '#EFF1E9',   // alternating section ground
  line: '#DCE0D4',       // card borders, hairlines
  lineStrong: '#CBD1C1', // outline-button borders
  body: '#465372',       // body copy
  muted: '#8A92A5',      // eyebrows, meta
  onDark: '#C8D0E2',     // body copy on navy
  onDarkMuted: '#8C9BBC',// meta on navy
  onDarkAccent: '#E8837E',// eyebrow on navy
  teal: '#00838F',       // multi-language badge
};

export default brand;
