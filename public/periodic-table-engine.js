/**
 * EduAshram Periodic Table Engine
 * Interactive 118-Element Modern Periodic Table, Bohr Atom Visualizer & Curriculum Inspector
 * Aligned with NCERT & CBSE Science Curriculum (Classes 9 & 10)
 */

(function () {
  "use strict";

  // =========================================================================
  // 1. Elements Dataset (1 to 118 complete)
  // =========================================================================

  const elements = [
  // Period 1
  { z: 1, symbol: "H", name: "Hydrogen", mass: 1.008, period: 1, group: 1, category: "nonmetal", phase: "gas", shells: [1], valency: 1, config: "1s¹", radius: 53, electronegativity: 2.20, summary: "Lightest element, universe's most abundant fuel, forms water." },
  { z: 2, symbol: "He", name: "Helium", mass: 4.003, period: 1, group: 18, category: "noble", phase: "gas", shells: [2], valency: 0, config: "1s²", radius: 31, electronegativity: null, summary: "Inert noble gas with duplet configuration, used in cryogenics." },

  // Period 2
  { z: 3, symbol: "Li", name: "Lithium", mass: 6.94, period: 2, group: 1, category: "alkali", phase: "solid", shells: [2, 1], valency: 1, config: "[He] 2s¹", radius: 167, electronegativity: 0.98, summary: "Lightest alkali metal, highly reactive, powers rechargeable Li-ion batteries." },
  { z: 4, symbol: "Be", name: "Beryllium", mass: 9.012, period: 2, group: 2, category: "alkaline", phase: "solid", shells: [2, 2], valency: 2, config: "[He] 2s²", radius: 112, electronegativity: 1.57, summary: "Strong, lightweight metal used in aerospace and X-ray windows." },
  { z: 5, symbol: "B", name: "Boron", mass: 10.81, period: 2, group: 13, category: "metalloid", phase: "solid", shells: [2, 3], valency: 3, config: "[He] 2s² 2p¹", radius: 87, electronegativity: 2.04, summary: "Hard metalloid used in borosilicate laboratory glassware (Pyrex)." },
  { z: 6, symbol: "C", name: "Carbon", mass: 12.011, period: 2, group: 14, category: "nonmetal", phase: "solid", shells: [2, 4], valency: 4, config: "[He] 2s² 2p²", radius: 67, electronegativity: 2.55, summary: "Basis of organic chemistry, exhibits catenation and allotropy (diamond, graphite)." },
  { z: 7, symbol: "N", name: "Nitrogen", mass: 14.007, period: 2, group: 15, category: "nonmetal", phase: "gas", shells: [2, 5], valency: 3, config: "[He] 2s² 2p³", radius: 56, electronegativity: 3.04, summary: "Constitutes 78% of atmosphere; building block of amino acids and proteins." },
  { z: 8, symbol: "O", name: "Oxygen", mass: 15.999, period: 2, group: 16, category: "nonmetal", phase: "gas", shells: [2, 6], valency: 2, config: "[He] 2s² 2p⁴", radius: 48, electronegativity: 3.44, summary: "Essential for cellular respiration and combustion, forms ozone (O3)." },
  { z: 9, symbol: "F", name: "Fluorine", mass: 18.998, period: 2, group: 17, category: "halogen", phase: "gas", shells: [2, 7], valency: 1, config: "[He] 2s² 2p⁵", radius: 42, electronegativity: 3.98, summary: "Most electronegative and reactive non-metal, forms stable fluorides." },
  { z: 10, symbol: "Ne", name: "Neon", mass: 20.180, period: 2, group: 18, category: "noble", phase: "gas", shells: [2, 8], valency: 0, config: "[He] 2s² 2p⁶", radius: 38, electronegativity: null, summary: "Stable octet noble gas, glows brilliant reddish-orange in signs." },

  // Period 3
  { z: 11, symbol: "Na", name: "Sodium", mass: 22.990, period: 3, group: 1, category: "alkali", phase: "solid", shells: [2, 8, 1], valency: 1, config: "[Ne] 3s¹", radius: 190, electronegativity: 0.93, summary: "Soft metal cut with knife, stored under kerosene, reacts with water." },
  { z: 12, symbol: "Mg", name: "Magnesium", mass: 24.305, period: 3, group: 2, category: "alkaline", phase: "solid", shells: [2, 8, 2], valency: 2, config: "[Ne] 3s²", radius: 145, electronegativity: 1.31, summary: "Burns with dazzling white flame forming basic MgO (NCERT Activity 1.1)." },
  { z: 13, symbol: "Al", name: "Aluminium", mass: 26.982, period: 3, group: 13, category: "post_transition", phase: "solid", shells: [2, 8, 3], valency: 3, config: "[Ne] 3s² 3p¹", radius: 118, electronegativity: 1.61, summary: "Abundant amphoteric metal; forms protective oxide film preventing corrosion." },
  { z: 14, symbol: "Si", name: "Silicon", mass: 28.085, period: 3, group: 14, category: "metalloid", phase: "solid", shells: [2, 8, 4], valency: 4, config: "[Ne] 3s² 3p²", radius: 111, electronegativity: 1.90, summary: "Essential semiconductor for transistors, computer microprocessors, and solar panels." },
  { z: 15, symbol: "P", name: "Phosphorus", mass: 30.974, period: 3, group: 15, category: "nonmetal", phase: "solid", shells: [2, 8, 5], valency: 3, config: "[Ne] 3s² 3p³", radius: 98, electronegativity: 2.19, summary: "Essential in DNA and ATP; red phosphorus is used in strike matchboxes." },
  { z: 16, symbol: "S", name: "Sulphur", mass: 32.06, period: 3, group: 16, category: "nonmetal", phase: "solid", shells: [2, 8, 6], valency: 2, config: "[Ne] 3s² 3p⁴", radius: 88, electronegativity: 2.58, summary: "Yellow non-metal forming S8 rings, burns with blue flame to pungent SO2." },
  { z: 17, symbol: "Cl", name: "Chlorine", mass: 35.45, period: 3, group: 17, category: "halogen", phase: "gas", shells: [2, 8, 7], valency: 1, config: "[Ne] 3s² 3p⁵", radius: 79, electronegativity: 3.16, summary: "Pungent green-yellow gas, disinfectant in drinking water, forms NaCl." },
  { z: 18, symbol: "Ar", name: "Argon", mass: 39.948, period: 3, group: 18, category: "noble", phase: "gas", shells: [2, 8, 8], valency: 0, config: "[Ne] 3s² 3p⁶", radius: 71, electronegativity: null, summary: "Noble gas providing inert protective shield inside incandescent bulbs." },

  // Period 4
  { z: 19, symbol: "K", name: "Potassium", mass: 39.098, period: 4, group: 1, category: "alkali", phase: "solid", shells: [2, 8, 8, 1], valency: 1, config: "[Ar] 4s¹", radius: 243, electronegativity: 0.82, summary: "Highly reactive alkali metal at top of reactivity series; lilac flame test." },
  { z: 20, symbol: "Ca", name: "Calcium", mass: 40.078, period: 4, group: 2, category: "alkaline", phase: "solid", shells: [2, 8, 8, 2], valency: 2, config: "[Ar] 4s²", radius: 194, electronegativity: 1.00, summary: "Key constituent of bones, limestone (CaCO3), and slaked lime [Ca(OH)2]." },
  { z: 21, symbol: "Sc", name: "Scandium", mass: 44.956, period: 4, group: 3, category: "transition", phase: "solid", shells: [2, 8, 9, 2], valency: 3, config: "[Ar] 3d¹ 4s²", radius: 184, electronegativity: 1.36, summary: "First transition element, strengthens aluminium alloys for aircraft." },
  { z: 22, symbol: "Ti", name: "Titanium", mass: 47.867, period: 4, group: 4, category: "transition", phase: "solid", shells: [2, 8, 10, 2], valency: 4, config: "[Ar] 3d² 4s²", radius: 176, electronegativity: 1.54, summary: "High strength-to-weight ratio, biocompatible metal for surgical implants." },
  { z: 23, symbol: "V", name: "Vanadium", mass: 50.942, period: 4, group: 5, category: "transition", phase: "solid", shells: [2, 8, 11, 2], valency: 5, config: "[Ar] 3d³ 4s²", radius: 171, electronegativity: 1.63, summary: "Steel additive producing shock-resistant high-tensile vanadium steel." },
  { z: 24, symbol: "Cr", name: "Chromium", mass: 51.996, period: 4, group: 6, category: "transition", phase: "solid", shells: [2, 8, 13, 1], valency: 3, config: "[Ar] 3d⁵ 4s¹", radius: 166, electronegativity: 1.66, summary: "Shiny metal used in electroplating and corrosion-resistant stainless steel." },
  { z: 25, symbol: "Mn", name: "Manganese", mass: 54.938, period: 4, group: 7, category: "transition", phase: "solid", shells: [2, 8, 13, 2], valency: 2, config: "[Ar] 3d⁵ 4s²", radius: 161, electronegativity: 1.55, summary: "Crucial deoxidizer in steel manufacture; KMnO4 is a strong oxidizer." },
  { z: 26, symbol: "Fe", name: "Iron", mass: 55.845, period: 4, group: 8, category: "transition", phase: "solid", shells: [2, 8, 14, 2], valency: 2, config: "[Ar] 3d⁶ 4s²", radius: 156, electronegativity: 1.83, summary: "Backbone of modern engineering, central oxygen-carrier in blood hemoglobin." },
  { z: 27, symbol: "Co", name: "Cobalt", mass: 58.933, period: 4, group: 9, category: "transition", phase: "solid", shells: [2, 8, 15, 2], valency: 2, config: "[Ar] 3d⁷ 4s²", radius: 152, electronegativity: 1.88, summary: "Ferromagnetic metal used in superalloys, blue glass, and vitamin B12." },
  { z: 28, symbol: "Ni", name: "Nickel", mass: 58.693, period: 4, group: 10, category: "transition", phase: "solid", shells: [2, 8, 16, 2], valency: 2, config: "[Ar] 3d⁸ 4s²", radius: 149, electronegativity: 1.91, summary: "Corrosion-resistant metal used in coins, stainless steel, and catalysts." },
  { z: 29, symbol: "Cu", name: "Copper", mass: 63.546, period: 4, group: 11, category: "transition", phase: "solid", shells: [2, 8, 18, 1], valency: 2, config: "[Ar] 3d¹⁰ 4s¹", radius: 145, electronegativity: 1.90, summary: "Reddish-brown metal, exceptional electrical conductor (NCERT Activity 3.1)." },
  { z: 30, symbol: "Zn", name: "Zinc", mass: 65.38, period: 4, group: 12, category: "transition", phase: "solid", shells: [2, 8, 18, 2], valency: 2, config: "[Ar] 3d¹⁰ 4s²", radius: 142, electronegativity: 1.65, summary: "Used for galvanizing iron (NCERT Ch 3); reacts with acid to give H2 gas." },
  { z: 31, symbol: "Ga", name: "Gallium", mass: 69.723, period: 4, group: 13, category: "post_transition", phase: "solid", shells: [2, 8, 18, 3], valency: 3, config: "[Ar] 3d¹⁰ 4s² 4p¹", radius: 136, electronegativity: 1.81, summary: "Melts in the palm of hand (~30°C); predicted by Mendeleev as Eka-aluminium." },
  { z: 32, symbol: "Ge", name: "Germanium", mass: 72.630, period: 4, group: 14, category: "metalloid", phase: "solid", shells: [2, 8, 18, 4], valency: 4, config: "[Ar] 3d¹⁰ 4s² 4p²", radius: 125, electronegativity: 2.01, summary: "Metalloid predicted by Mendeleev as Eka-silicon, essential in optics." },
  { z: 33, symbol: "As", name: "Arsenic", mass: 74.922, period: 4, group: 15, category: "metalloid", phase: "solid", shells: [2, 8, 18, 5], valency: 3, config: "[Ar] 3d¹⁰ 4s² 4p³", radius: 114, electronegativity: 2.18, summary: "Brittle grey metalloid historically notorious as poison, used in doping." },
  { z: 34, symbol: "Se", name: "Selenium", mass: 78.971, period: 4, group: 16, category: "nonmetal", phase: "solid", shells: [2, 8, 18, 6], valency: 2, config: "[Ar] 3d¹⁰ 4s² 4p⁴", radius: 103, electronegativity: 2.55, summary: "Photoconductive non-metal used in photocopiers and photocells." },
  { z: 35, symbol: "Br", name: "Bromine", mass: 79.904, period: 4, group: 17, category: "halogen", phase: "liquid", shells: [2, 8, 18, 7], valency: 1, config: "[Ar] 3d¹⁰ 4s² 4p⁵", radius: 94, electronegativity: 2.96, summary: "The only liquid non-metal at room temperature; reddish-brown volatile liquid." },
  { z: 36, symbol: "Kr", name: "Krypton", mass: 83.798, period: 4, group: 18, category: "noble", phase: "gas", shells: [2, 8, 18, 8], valency: 0, config: "[Ar] 3d¹⁰ 4s² 4p⁶", radius: 88, electronegativity: 3.00, summary: "Noble gas used in high-speed flash photography and airport runway lighting." },

  // Period 5
  { z: 37, symbol: "Rb", name: "Rubidium", mass: 85.468, period: 5, group: 1, category: "alkali", phase: "solid", shells: [2, 8, 18, 8, 1], valency: 1, config: "[Kr] 5s¹", radius: 265, electronegativity: 0.82, summary: "Soft, highly reactive alkali metal spontaneously catching fire in air." },
  { z: 38, symbol: "Sr", name: "Strontium", mass: 87.62, period: 5, group: 2, category: "alkaline", phase: "solid", shells: [2, 8, 18, 8, 2], valency: 2, config: "[Kr] 5s²", radius: 219, electronegativity: 0.95, summary: "Burns with a deep crimson flame, giving vivid red colors to fireworks." },
  { z: 39, symbol: "Y", name: "Yttrium", mass: 88.906, period: 5, group: 3, category: "transition", phase: "solid", shells: [2, 8, 18, 9, 2], valency: 3, config: "[Kr] 4d¹ 5s²", radius: 212, electronegativity: 1.22, summary: "Rare-earth transition metal used in high-temperature superconductors (YBCO)." },
  { z: 40, symbol: "Zr", name: "Zirconium", mass: 91.224, period: 5, group: 4, category: "transition", phase: "solid", shells: [2, 8, 18, 10, 2], valency: 4, config: "[Kr] 4d² 5s²", radius: 206, electronegativity: 1.33, summary: "Corrosion-resistant metal with low neutron absorption, clads nuclear rods." },
  { z: 41, symbol: "Nb", name: "Niobium", mass: 92.906, period: 5, group: 5, category: "transition", phase: "solid", shells: [2, 8, 18, 12, 1], valency: 5, config: "[Kr] 4d⁴ 5s¹", radius: 198, electronegativity: 1.6, summary: "Superconducting metal used in powerful MRI scanner electromagnets." },
  { z: 42, symbol: "Mo", name: "Molybdenum", mass: 95.95, period: 5, group: 6, category: "transition", phase: "solid", shells: [2, 8, 18, 13, 1], valency: 6, config: "[Kr] 4d⁵ 5s¹", radius: 190, electronegativity: 2.16, summary: "Refractory metal with high melting point (2623°C), reinforces steel armor." },
  { z: 43, symbol: "Tc", name: "Technetium", mass: 98, period: 5, group: 7, category: "transition", phase: "solid", shells: [2, 8, 18, 13, 2], valency: 7, config: "[Kr] 4d⁵ 5s²", radius: 183, electronegativity: 1.9, summary: "First artificially created element; radioactive tracer (Tc-99m) in medicine." },
  { z: 44, symbol: "Ru", name: "Ruthenium", mass: 101.07, period: 5, group: 8, category: "transition", phase: "solid", shells: [2, 8, 18, 15, 1], valency: 4, config: "[Kr] 4d⁷ 5s¹", radius: 178, electronegativity: 2.2, summary: "Platinum group metal, hardens platinum and acts as industrial catalyst." },
  { z: 45, symbol: "Rh", name: "Rhodium", mass: 102.91, period: 5, group: 9, category: "transition", phase: "solid", shells: [2, 8, 18, 16, 1], valency: 3, config: "[Kr] 4d⁸ 5s¹", radius: 173, electronegativity: 2.28, summary: "Extremely precious noble metal, key component in automotive catalytic converters." },
  { z: 46, symbol: "Pd", name: "Palladium", mass: 106.42, period: 5, group: 10, category: "transition", phase: "solid", shells: [2, 8, 18, 18], valency: 2, config: "[Kr] 4d¹⁰", radius: 169, electronegativity: 2.20, summary: "Absorbs up to 900 times its volume of hydrogen gas; used in white gold." },
  { z: 47, symbol: "Ag", name: "Silver", mass: 107.87, period: 5, group: 11, category: "transition", phase: "solid", shells: [2, 8, 18, 18, 1], valency: 1, config: "[Kr] 4d¹⁰ 5s¹", radius: 165, electronegativity: 1.93, summary: "Best electrical and thermal conductor of all metals; lustrous coin metal." },
  { z: 48, symbol: "Cd", name: "Cadmium", mass: 112.41, period: 5, group: 12, category: "transition", phase: "solid", shells: [2, 8, 18, 18, 2], valency: 2, config: "[Kr] 4d¹⁰ 5s²", radius: 161, electronegativity: 1.69, summary: "Toxic metal used in NiCd batteries and neutron-absorbing control rods." },
  { z: 49, symbol: "In", name: "Indium", mass: 114.82, period: 5, group: 13, category: "post_transition", phase: "solid", shells: [2, 8, 18, 18, 3], valency: 3, config: "[Kr] 4d¹⁰ 5s² 5p¹", radius: 156, electronegativity: 1.78, summary: "Soft metal essential in Indium Tin Oxide (ITO) for touchscreens." },
  { z: 50, symbol: "Sn", name: "Tin", mass: 118.71, period: 5, group: 14, category: "post_transition", phase: "solid", shells: [2, 8, 18, 18, 4], valency: 4, config: "[Kr] 4d¹⁰ 5s² 5p²", radius: 145, electronegativity: 1.96, summary: "Forms bronze (with copper) and solder (with lead); protects tin cans." },
  { z: 51, symbol: "Sb", name: "Antimony", mass: 121.76, period: 5, group: 15, category: "metalloid", phase: "solid", shells: [2, 8, 18, 18, 5], valency: 3, config: "[Kr] 4d¹⁰ 5s² 5p³", radius: 133, electronegativity: 2.05, summary: "Metalloid alloyed with lead to increase battery plate hardness and strength." },
  { z: 52, symbol: "Te", name: "Tellurium", mass: 127.60, period: 5, group: 16, category: "metalloid", phase: "solid", shells: [2, 8, 18, 18, 6], valency: 2, config: "[Kr] 4d¹⁰ 5s² 5p⁴", radius: 123, electronegativity: 2.1, summary: "Rare metalloid used in thermoelectric coolers and CD-RW rewritable discs." },
  { z: 53, symbol: "I", name: "Iodine", mass: 126.90, period: 5, group: 17, category: "halogen", phase: "solid", shells: [2, 8, 18, 18, 7], valency: 1, config: "[Kr] 4d¹⁰ 5s² 5p⁵", radius: 115, electronegativity: 2.66, summary: "Lustrous purple non-metal that sublimes readily; essential in iodized salt." },
  { z: 54, symbol: "Xe", name: "Xenon", mass: 131.29, period: 5, group: 18, category: "noble", phase: "gas", shells: [2, 8, 18, 18, 8], valency: 0, config: "[Kr] 4d¹⁰ 5s² 5p⁶", radius: 108, electronegativity: 2.60, summary: "Heavy noble gas, first found to form true chemical compounds (XePtF6)." },

  // Period 6
  { z: 55, symbol: "Cs", name: "Caesium", mass: 132.91, period: 6, group: 1, category: "alkali", phase: "solid", shells: [2, 8, 18, 18, 8, 1], valency: 1, config: "[Xe] 6s¹", radius: 298, electronegativity: 0.79, summary: "Most electropositive stable metal, standard in atomic clocks defining the second." },
  { z: 56, symbol: "Ba", name: "Barium", mass: 137.33, period: 6, group: 2, category: "alkaline", phase: "solid", shells: [2, 8, 18, 18, 8, 2], valency: 2, config: "[Xe] 6s²", radius: 253, electronegativity: 0.89, summary: "Burns with apple green flame, insoluble BaSO4 used in X-ray gastrointestinal meals." },
  // Lanthanides (57 to 71)
  { z: 57, symbol: "La", name: "Lanthanum", mass: 138.91, period: 6, group: 3, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 18, 9, 2], valency: 3, config: "[Xe] 5d¹ 6s²", radius: 226, electronegativity: 1.10, summary: "Namesake of lanthanide series, used in camera lenses and hybrid battery electrodes." },
  { z: 58, symbol: "Ce", name: "Cerium", mass: 140.12, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 19, 9, 2], valency: 3, config: "[Xe] 4f¹ 5d¹ 6s²", radius: 210, electronegativity: 1.12, summary: "Most abundant rare-earth metal, key part of mischmetal sparking flints." },
  { z: 59, symbol: "Pr", name: "Praseodymium", mass: 140.91, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 21, 8, 2], valency: 3, config: "[Xe] 4f³ 6s²", radius: 247, electronegativity: 1.13, summary: "Rare earth giving characteristic yellow-green color to welder goggles." },
  { z: 60, symbol: "Nd", name: "Neodymium", mass: 144.24, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 22, 8, 2], valency: 3, config: "[Xe] 4f⁴ 6s²", radius: 206, electronegativity: 1.14, summary: "Makes world's strongest permanent magnets (NdFeB) for electric motors." },
  { z: 61, symbol: "Pm", name: "Promethium", mass: 145, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 23, 8, 2], valency: 3, config: "[Xe] 4f⁵ 6s²", radius: 205, electronegativity: 1.13, summary: "Only radioactive lanthanide, used in atomic batteries for pacemakers." },
  { z: 62, symbol: "Sm", name: "Samarium", mass: 150.36, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 24, 8, 2], valency: 3, config: "[Xe] 4f⁶ 6s²", radius: 238, electronegativity: 1.17, summary: "Rare-earth magnet component resisting demagnetization at high heat." },
  { z: 63, symbol: "Eu", name: "Europium", mass: 151.96, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 25, 8, 2], valency: 3, config: "[Xe] 4f⁷ 6s²", radius: 231, electronegativity: 1.2, summary: "Provides red and blue phosphors in displays and anti-counterfeiting Euro banknotes." },
  { z: 64, symbol: "Gd", name: "Gadolinium", mass: 157.25, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 25, 9, 2], valency: 3, config: "[Xe] 4f⁷ 5d¹ 6s²", radius: 233, electronegativity: 1.20, summary: "Paramagnetic element used as contrast agent in medical MRI scans." },
  { z: 65, symbol: "Tb", name: "Terbium", mass: 158.93, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 27, 8, 2], valency: 3, config: "[Xe] 4f⁹ 6s²", radius: 225, electronegativity: 1.2, summary: "Green phosphor in television screens and magnetostrictive sonar transducers." },
  { z: 66, symbol: "Dy", name: "Dysprosium", mass: 162.50, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 28, 8, 2], valency: 3, config: "[Xe] 4f¹⁰ 6s²", radius: 228, electronegativity: 1.22, summary: "High magnetic susceptibility, stabilizes EV motor magnets at high speeds." },
  { z: 67, symbol: "Ho", name: "Holmium", mass: 164.93, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 29, 8, 2], valency: 3, config: "[Xe] 4f¹¹ 6s²", radius: 226, electronegativity: 1.23, summary: "Highest magnetic moment of any element; used in specialized surgical lasers." },
  { z: 68, symbol: "Er", name: "Erbium", mass: 167.26, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 30, 8, 2], valency: 3, config: "[Xe] 4f¹² 6s²", radius: 226, electronegativity: 1.24, summary: "Pink-tinted element doping fiber-optic amplifiers powering internet cables." },
  { z: 69, symbol: "Tm", name: "Thulium", mass: 168.93, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 31, 8, 2], valency: 3, config: "[Xe] 4f¹³ 6s²", radius: 222, electronegativity: 1.25, summary: "Second-rarest naturally occurring lanthanide, radiation source in portable X-rays." },
  { z: 70, symbol: "Yb", name: "Ytterbium", mass: 173.05, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 32, 8, 2], valency: 3, config: "[Xe] 4f¹⁴ 6s²", radius: 222, electronegativity: 1.1, summary: "Used in optical atomic clocks and stress sensors in seismic zones." },
  { z: 71, symbol: "Lu", name: "Lutetium", mass: 174.97, period: 6, group: null, category: "lanthanide", phase: "solid", shells: [2, 8, 18, 32, 9, 2], valency: 3, config: "[Xe] 4f¹⁴ 5d¹ 6s²", radius: 217, electronegativity: 1.27, summary: "Hardest and densest lanthanide, targeted radiopharmaceutical in cancer treatment." },

  // Remaining Period 6
  { z: 72, symbol: "Hf", name: "Hafnium", mass: 178.49, period: 6, group: 4, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 10, 2], valency: 4, config: "[Xe] 4f¹⁴ 5d² 6s²", radius: 208, electronegativity: 1.3, summary: "Excellent neutron absorber in nuclear reactor control rods of submarines." },
  { z: 73, symbol: "Ta", name: "Tantalum", mass: 180.95, period: 6, group: 5, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 11, 2], valency: 5, config: "[Xe] 4f¹⁴ 5d³ 6s²", radius: 200, electronegativity: 1.5, summary: "Highly corrosion-resistant metal, vital for micro-capacitors in smartphones." },
  { z: 74, symbol: "W", name: "Tungsten", mass: 183.84, period: 6, group: 6, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 12, 2], valency: 6, config: "[Xe] 4f¹⁴ 5d⁴ 6s²", radius: 193, electronegativity: 2.36, summary: "Highest melting point of all metals (3422°C), traditional bulb filaments." },
  { z: 75, symbol: "Re", name: "Rhenium", mass: 186.21, period: 6, group: 7, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 13, 2], valency: 7, config: "[Xe] 4f¹⁴ 5d⁵ 6s²", radius: 188, electronegativity: 1.9, summary: "Ultra-dense metal with third-highest melting point, reinforces jet turbine blades." },
  { z: 76, symbol: "Os", name: "Osmium", mass: 190.23, period: 6, group: 8, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 14, 2], valency: 4, config: "[Xe] 4f¹⁴ 5d⁶ 6s²", radius: 185, electronegativity: 2.2, summary: "Densest naturally occurring element (22.59 g/cm³), tips fountain pens." },
  { z: 77, symbol: "Ir", name: "Iridium", mass: 192.22, period: 6, group: 9, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 15, 2], valency: 4, config: "[Xe] 4f¹⁴ 5d⁷ 6s²", radius: 180, electronegativity: 2.20, summary: "Most corrosion-resistant metal known, made original standard meter bar." },
  { z: 78, symbol: "Pt", name: "Platinum", mass: 195.08, period: 6, group: 10, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 17, 1], valency: 4, config: "[Xe] 4f¹⁴ 5d⁹ 6s¹", radius: 177, electronegativity: 2.28, summary: "Precious noble metal, unreactive catalyst and anticancer drug cisplatin." },
  { z: 79, symbol: "Au", name: "Gold", mass: 196.97, period: 6, group: 11, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 18, 1], valency: 3, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", radius: 174, electronegativity: 2.54, summary: "Most malleable and ductile metal; Rutherford's gold foil experiment (NCERT Ch 4)." },
  { z: 80, symbol: "Hg", name: "Mercury", mass: 200.59, period: 6, group: 12, category: "transition", phase: "liquid", shells: [2, 8, 18, 32, 18, 2], valency: 2, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", radius: 171, electronegativity: 2.00, summary: "Only metal that is liquid at room temperature; ore is cinnabar (HgS)." },
  { z: 81, symbol: "Tl", name: "Thallium", mass: 204.38, period: 6, group: 13, category: "post_transition", phase: "solid", shells: [2, 8, 18, 32, 18, 3], valency: 1, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", radius: 156, electronegativity: 1.62, summary: "Highly toxic heavy metal once used in rodent poisons, now in infrared optics." },
  { z: 82, symbol: "Pb", name: "Lead", mass: 207.2, period: 6, group: 14, category: "post_transition", phase: "solid", shells: [2, 8, 18, 32, 18, 4], valency: 2, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", radius: 154, electronegativity: 2.33, summary: "Dense, malleable metal used for radiation shielding and car lead-acid batteries." },
  { z: 83, symbol: "Bi", name: "Bismuth", mass: 208.98, period: 6, group: 15, category: "post_transition", phase: "solid", shells: [2, 8, 18, 32, 18, 5], valency: 3, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", radius: 143, electronegativity: 2.02, summary: "Forms iridescent hopper crystals, active ingredient in Pepto-Bismol." },
  { z: 84, symbol: "Po", name: "Polonium", mass: 209, period: 6, group: 16, category: "post_transition", phase: "solid", shells: [2, 8, 18, 32, 18, 6], valency: 2, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", radius: 135, electronegativity: 2.0, summary: "Radioactive element discovered by Marie Curie, named after her homeland Poland." },
  { z: 85, symbol: "At", name: "Astatine", mass: 210, period: 6, group: 17, category: "halogen", phase: "solid", shells: [2, 8, 18, 32, 18, 7], valency: 1, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", radius: 127, electronegativity: 2.2, summary: "Rarest naturally occurring element in Earth's crust (<1 gram total)." },
  { z: 86, symbol: "Rn", name: "Radon", mass: 222, period: 6, group: 18, category: "noble", phase: "gas", shells: [2, 8, 18, 32, 18, 8], valency: 0, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", radius: 120, electronegativity: 2.2, summary: "Heavy radioactive noble gas emanating from decay of radium in rocks and soil." },

  // Period 7
  { z: 87, symbol: "Fr", name: "Francium", mass: 223, period: 7, group: 1, category: "alkali", phase: "solid", shells: [2, 8, 18, 32, 18, 8, 1], valency: 1, config: "[Rn] 7s¹", radius: 348, electronegativity: 0.7, summary: "Extremely rare and radioactive alkali metal, half-life of only 22 minutes." },
  { z: 88, symbol: "Ra", name: "Radium", mass: 226, period: 7, group: 2, category: "alkaline", phase: "solid", shells: [2, 8, 18, 32, 18, 8, 2], valency: 2, config: "[Rn] 7s²", radius: 283, electronegativity: 0.9, summary: "Radioactive alkaline earth metal isolated by Marie and Pierre Curie from pitchblende." },
  // Actinides (89 to 103)
  { z: 89, symbol: "Ac", name: "Actinium", mass: 227, period: 7, group: 3, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 18, 9, 2], valency: 3, config: "[Rn] 6d¹ 7s²", radius: 260, electronegativity: 1.1, summary: "Intensely radioactive metal that glows with eerie blue light in darkness." },
  { z: 90, symbol: "Th", name: "Thorium", mass: 232.04, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 18, 10, 2], valency: 4, config: "[Rn] 6d² 7s²", radius: 237, electronegativity: 1.3, summary: "Abundant nuclear fuel in Indian monazite sands, powers 3-stage nuclear program." },
  { z: 91, symbol: "Pa", name: "Protactinium", mass: 231.04, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 20, 9, 2], valency: 5, config: "[Rn] 5f² 6d¹ 7s²", radius: 243, electronegativity: 1.5, summary: "Rare actinide intermediary formed during radioactive decay of uranium-235." },
  { z: 92, symbol: "U", name: "Uranium", mass: 238.03, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 21, 9, 2], valency: 6, config: "[Rn] 5f³ 6d¹ 7s²", radius: 240, electronegativity: 1.38, summary: "Primary fuel for commercial nuclear reactors; U-235 sustains fission chain reaction." },
  { z: 93, symbol: "Np", name: "Neptunium", mass: 237, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 22, 9, 2], valency: 5, config: "[Rn] 5f⁴ 6d¹ 7s²", radius: 221, electronegativity: 1.36, summary: "First transuranic element synthesized, produced in nuclear reactors from uranium." },
  { z: 94, symbol: "Pu", name: "Plutonium", mass: 244, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 24, 8, 2], valency: 4, config: "[Rn] 5f⁶ 7s²", radius: 243, electronegativity: 1.28, summary: "Fissile actinide (Pu-239), fuel source in deep-space probe RTG power systems." },
  { z: 95, symbol: "Am", name: "Americium", mass: 243, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 25, 8, 2], valency: 3, config: "[Rn] 5f⁷ 7s²", radius: 244, electronegativity: 1.3, summary: "Household ionization smoke detectors utilize minute traces of Americium-241." },
  { z: 96, symbol: "Cm", name: "Curium", mass: 247, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 25, 9, 2], valency: 3, config: "[Rn] 5f⁷ 6d¹ 7s²", radius: 245, electronegativity: 1.3, summary: "Alpha particle radiation source aboard Mars rovers for soil composition analysis." },
  { z: 97, symbol: "Bk", name: "Berkelium", mass: 247, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 27, 8, 2], valency: 3, config: "[Rn] 5f⁹ 7s²", radius: 244, electronegativity: 1.3, summary: "Synthetic actinide created at UC Berkeley, target in synthesizing tennessine." },
  { z: 98, symbol: "Cf", name: "Californium", mass: 251, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 28, 8, 2], valency: 3, config: "[Rn] 5f¹⁰ 7s²", radius: 245, electronegativity: 1.3, summary: "Strong portable neutron emitter used in oil well logging and detecting explosives." },
  { z: 99, symbol: "Es", name: "Einsteinium", mass: 252, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 29, 8, 2], valency: 3, config: "[Rn] 5f¹¹ 7s²", radius: 245, electronegativity: 1.3, summary: "Discovered in debris of first thermonuclear hydrogen bomb explosion (Ivy Mike)." },
  { z: 100, symbol: "Fm", name: "Fermium", mass: 257, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 30, 8, 2], valency: 3, config: "[Rn] 5f¹² 7s²", radius: 245, electronegativity: 1.3, summary: "Heaviest element that can be produced by neutron bombardment of lighter elements." },
  { z: 101, symbol: "Md", name: "Mendelevium", mass: 258, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 31, 8, 2], valency: 3, config: "[Rn] 5f¹³ 7s²", radius: 246, electronegativity: 1.3, summary: "Named in honor of Dmitri Mendeleev, father of the Periodic Table." },
  { z: 102, symbol: "No", name: "Nobelium", mass: 259, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 32, 8, 2], valency: 2, config: "[Rn] 5f¹⁴ 7s²", radius: 246, electronegativity: 1.3, summary: "Named after Alfred Nobel, inventor of dynamite and founder of Nobel Prizes." },
  { z: 103, symbol: "Lr", name: "Lawrencium", mass: 266, period: 7, group: null, category: "actinide", phase: "solid", shells: [2, 8, 18, 32, 32, 8, 3], valency: 3, config: "[Rn] 5f¹⁴ 7s² 7p¹", radius: 246, electronegativity: 1.3, summary: "Final member of actinide series, named for cyclotron inventor Ernest Lawrence." },

  // Superheavy elements (104 to 118)
  { z: 104, symbol: "Rf", name: "Rutherfordium", mass: 267, period: 7, group: 4, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 32, 10, 2], valency: 4, config: "[Rn] 5f¹⁴ 6d² 7s²", radius: null, electronegativity: null, summary: "Synthetic element named for Ernest Rutherford, pioneer of atomic nuclear structure." },
  { z: 105, symbol: "Db", name: "Dubnium", mass: 268, period: 7, group: 5, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 32, 11, 2], valency: 5, config: "[Rn] 5f¹⁴ 6d³ 7s²", radius: null, electronegativity: null, summary: "Named after Joint Institute for Nuclear Research located in Dubna, Russia." },
  { z: 106, symbol: "Sg", name: "Seaborgium", mass: 269, period: 7, group: 6, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 32, 12, 2], valency: 6, config: "[Rn] 5f¹⁴ 6d⁴ 7s²", radius: null, electronegativity: null, summary: "First element named after a living person, nuclear chemist Glenn T. Seaborg." },
  { z: 107, symbol: "Bh", name: "Bohrium", mass: 270, period: 7, group: 7, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 32, 13, 2], valency: 7, config: "[Rn] 5f¹⁴ 6d⁵ 7s²", radius: null, electronegativity: null, summary: "Named after Niels Bohr, who proposed the Bohr planetary model of the atom." },
  { z: 108, symbol: "Hs", name: "Hassium", mass: 269, period: 7, group: 8, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 32, 14, 2], valency: 8, config: "[Rn] 5f¹⁴ 6d⁶ 7s²", radius: null, electronegativity: null, summary: "Superheavy element synthesized in Darmstadt, named for German state of Hesse." },
  { z: 109, symbol: "Mt", name: "Meitnerium", mass: 278, period: 7, group: 9, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 32, 15, 2], valency: 4, config: "[Rn] 5f¹⁴ 6d⁷ 7s²", radius: null, electronegativity: null, summary: "Named in honor of physicist Lise Meitner, discoverer of nuclear fission." },
  { z: 110, symbol: "Ds", name: "Darmstadtium", mass: 281, period: 7, group: 10, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 32, 17, 1], valency: 4, config: "[Rn] 5f¹⁴ 6d⁹ 7s¹", radius: null, electronegativity: null, summary: "Synthesized via fusion of lead-208 and nickel-62 isotopes in Darmstadt." },
  { z: 111, symbol: "Rg", name: "Roentgenium", mass: 282, period: 7, group: 11, category: "transition", phase: "solid", shells: [2, 8, 18, 32, 32, 18, 1], valency: 3, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s¹", radius: null, electronegativity: null, summary: "Named after Wilhelm Röntgen, discoverer of diagnostic X-rays." },
  { z: 112, symbol: "Cn", name: "Copernicium", mass: 285, period: 7, group: 12, category: "transition", phase: "liquid", shells: [2, 8, 18, 32, 32, 18, 2], valency: 2, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s²", radius: null, electronegativity: null, summary: "Named in honor of astronomer Nicolaus Copernicus (heliocentric model)." },
  { z: 113, symbol: "Nh", name: "Nihonium", mass: 286, period: 7, group: 13, category: "post_transition", phase: "solid", shells: [2, 8, 18, 32, 32, 18, 3], valency: 3, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹", radius: null, electronegativity: null, summary: "First element discovered in Asia (RIKEN Institute in Japan; Nihon = Japan)." },
  { z: 114, symbol: "Fl", name: "Flerovium", mass: 289, period: 7, group: 14, category: "post_transition", phase: "solid", shells: [2, 8, 18, 32, 32, 18, 4], valency: 4, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²", radius: null, electronegativity: null, summary: "Named for Flerov Laboratory of Nuclear Reactions; possible island of stability." },
  { z: 115, symbol: "Mc", name: "Moscovium", mass: 290, period: 7, group: 15, category: "post_transition", phase: "solid", shells: [2, 8, 18, 32, 32, 18, 5], valency: 3, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³", radius: null, electronegativity: null, summary: "Superheavy element named after Moscow Oblast, Russia." },
  { z: 116, symbol: "Lv", name: "Livermorium", mass: 293, period: 7, group: 16, category: "post_transition", phase: "solid", shells: [2, 8, 18, 32, 32, 18, 6], valency: 2, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴", radius: null, electronegativity: null, summary: "Named for Lawrence Livermore National Laboratory in Livermore, California." },
  { z: 117, symbol: "Ts", name: "Tennessine", mass: 294, period: 7, group: 17, category: "halogen", phase: "solid", shells: [2, 8, 18, 32, 32, 18, 7], valency: 1, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵", radius: null, electronegativity: null, summary: "Second-heaviest known element, recognized by IUPAC in 2016." },
  { z: 118, symbol: "Og", name: "Oganesson", mass: 294, period: 7, group: 18, category: "noble", phase: "solid", shells: [2, 8, 18, 32, 32, 18, 8], valency: 0, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶", radius: null, electronegativity: null, summary: "Heaviest known element in periodic table, named for physicist Yuri Oganessian." }
];

  const CATEGORIES = {
    alkali: { label: "Alkali Metals", bg: "#ffedd5", text: "#9a3412", border: "#fed7aa" },
    alkaline: { label: "Alkaline Earth Metals", bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
    transition: { label: "Transition Metals", bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe" },
    post_transition: { label: "Post-Transition Metals", bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
    metalloid: { label: "Metalloids", bg: "#ccfbf1", text: "#115e59", border: "#99f6e4" },
    nonmetal: { label: "Reactive Non-Metals", bg: "#dcfce7", text: "#166534", border: "#bbf7d0" },
    halogen: { label: "Halogens", bg: "#fae8ff", text: "#86198f", border: "#f5d0fe" },
    noble: { label: "Noble Gases", bg: "#f1f5f9", text: "#334155", border: "#e2e8f0" },
    lanthanide: { label: "Lanthanides", bg: "#fce7f3", text: "#9d174d", border: "#fbcfe8" },
    actinide: { label: "Actinides", bg: "#ffe4e6", text: "#9f1239", border: "#fecdd3" }
  };

  const SHELL_NAMES = ["K", "L", "M", "N", "O", "P", "Q"];

  // =========================================================================
  // 2. Bohr Atom Model Canvas Renderer
  // =========================================================================

  function renderBohrAtom(canvas, shells, symbol, z, isDark) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.43;
    const numShells = Math.max(1, shells ? shells.length : 1);
    const shellStep = (maxR - 22) / Math.max(1, numShells);

    const orbitColor = isDark ? "rgba(148, 163, 184, 0.45)" : "rgba(148, 163, 184, 0.55)";
    const orbitFill = isDark ? "rgba(30, 41, 59, 0.2)" : "rgba(241, 245, 249, 0.35)";

    // Concentric electron shells
    (shells || [1]).forEach((count, sIdx) => {
      const r = 24 + (sIdx + 1) * shellStep;

      // Subtle track glow
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = orbitFill;
      ctx.fill();
      ctx.strokeStyle = orbitColor;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Shell label badge (K, L, M, N) positioned at 35 degrees to never overlap electrons at 12 o'clock
      const sName = SHELL_NAMES[sIdx] || ("S" + (sIdx + 1));
      const badgeAngle = -Math.PI / 2 + 0.65; // ~37 degrees clockwise from top
      const bx = cx + r * Math.cos(badgeAngle);
      const by = cy + r * Math.sin(badgeAngle);

      ctx.save();
      ctx.font = "bold 9px system-ui, -apple-system, sans-serif";
      const lblW = ctx.measureText(sName).width + 6;
      ctx.fillStyle = isDark ? "#1e293b" : "#ffffff";
      ctx.strokeStyle = isDark ? "#475569" : "#bae6fd";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(bx - lblW / 2, by - 6, lblW, 12, 3) : ctx.rect(bx - lblW / 2, by - 6, lblW, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark ? "#38bdf8" : "#0284c7";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sName, bx, by);
      ctx.restore();

      // Electron dots around orbit
      for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        const ex = cx + r * Math.cos(angle);
        const ey = cy + r * Math.sin(angle);

        // Radial outer glow
        ctx.beginPath();
        ctx.arc(ex, ey, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
        ctx.fill();

        // Main particle
        ctx.beginPath();
        ctx.arc(ex, ey, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = "#0284c7";
        ctx.fill();

        // Inner specular highlight
        ctx.beginPath();
        ctx.arc(ex - 1, ey - 1, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
    });

    // Nucleus with depth & glow
    ctx.save();
    // Nucleus aura
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.12)";
    ctx.fill();

    // Nucleus sphere gradient
    const nucGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 18);
    nucGrad.addColorStop(0, "#38bdf8");
    nucGrad.addColorStop(0.7, "#0284c7");
    nucGrad.addColorStop(1, "#0369a1");

    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = nucGrad;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Nucleus Symbol & Charge
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbol || "H", cx, cy - 3);

    ctx.font = "bold 8px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#fef08a";
    ctx.fillText("+" + (z || 1), cx, cy + 8);
    ctx.restore();
  }

  // =========================================================================
  // 3. Vector Canvas Drawing on Whiteboard: Element Card & Full Table
  // =========================================================================

  function drawElementCardShape(ctx, shape, isPreview) {
    if (!shape || !shape.start || !shape.end) return;

    const x1 = Math.min(shape.start.x, shape.end.x);
    const x2 = Math.max(shape.start.x, shape.end.x);
    const y1 = Math.min(shape.start.y, shape.end.y);
    const y2 = Math.max(shape.start.y, shape.end.y);
    const w = x2 - x1;
    const h = y2 - y1;

    if (w < 60 || h < 60) return;

    ctx.save();

    let isDark = false;
    if (typeof boardTheme === "string" && (boardTheme === "blackboard" || boardTheme === "dark")) {
      isDark = true;
    }

    const el = elements.find((e) => e.z === shape.atomicNumber) || elements[10];
    const cat = CATEGORIES[el.category] || CATEGORIES.alkali;

    // 1. Outer Card Background
    const radius = 12;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x1, y1, w, h, radius) : ctx.rect(x1, y1, w, h);
    ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.97)" : "#ffffff";
    ctx.fill();
    ctx.strokeStyle = isDark ? "#38bdf8" : cat.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Top Header Banner
    const headerH = Math.max(34, Math.min(42, Math.round(h * 0.085)));
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x1, y1, w, headerH, [radius, radius, 0, 0]) : ctx.rect(x1, y1, w, headerH);
    ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.95)" : cat.bg;
    ctx.fill();
    ctx.strokeStyle = cat.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Category Label on Left
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = cat.text;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const headerTitle = cat.label + " · Period " + el.period + (el.group ? " · Group " + el.group : "");
    ctx.fillText(headerTitle, x1 + 12, y1 + headerH / 2);

    // Z Pill on Right
    const zPillText = "Z = " + el.z;
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    const zPillW = ctx.measureText(zPillText).width + 12;
    const zPillH = 20;
    const zPillX = x2 - zPillW - 10;
    const zPillY = y1 + (headerH - zPillH) / 2;

    ctx.fillStyle = isDark ? "#0f172a" : "#ffffff";
    ctx.strokeStyle = cat.border;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(zPillX, zPillY, zPillW, zPillH, 4) : ctx.rect(zPillX, zPillY, zPillW, zPillH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = cat.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(zPillText, zPillX + zPillW / 2, zPillY + zPillH / 2);

    // 3. Upper Left: Large Element Tile
    const tileW = Math.max(90, Math.min(125, Math.round(w * 0.35)));
    const tileH = tileW;
    const tileX = x1 + 14;
    const tileY = y1 + headerH + 12;

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(tileX, tileY, tileW, tileH, 9) : ctx.rect(tileX, tileY, tileW, tileH);
    ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.9)" : cat.bg;
    ctx.fill();
    ctx.strokeStyle = cat.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Atomic Number (top-left of tile)
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(el.z.toString(), tileX + 7, tileY + 6);

    // Atomic Mass (top-right of tile)
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(el.mass + " u", tileX + tileW - 7, tileY + 6);

    // Large Chemical Symbol
    const symFontSize = Math.max(34, Math.min(52, Math.round(tileW * 0.45)));
    ctx.font = "bold " + symFontSize + "px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#f8fafc" : cat.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(el.symbol, tileX + tileW / 2, tileY + tileH * 0.52);

    // Element Name (bottom of tile)
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#cbd5e1" : "#334155";
    ctx.fillText(el.name, tileX + tileW / 2, tileY + tileH - 10);

    // 4. Upper Right: Prominent Properties
    const propX = tileX + tileW + 16;
    const propW = x2 - propX - 14;
    let propY = tileY + 6;
    const propLineH = Math.max(26, Math.round(tileH / 3.2));

    function drawProperty(label, val, valCol, isPill) {
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, propX, propY);

      if (isPill) {
        ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
        const pText = val;
        const pW = ctx.measureText(pText).width + 12;
        const pH = 20;
        const pX = propX + 85;
        const pY = propY - pH / 2;

        ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.9)" : "#f0fdf4";
        ctx.strokeStyle = "#86efac";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(pX, pY, pW, pH, 4) : ctx.rect(pX, pY, pW, pH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = valCol || "#16a34a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pText, pX + pW / 2, propY);
      } else {
        ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = valCol || (isDark ? "#f8fafc" : "#0f172a");
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(val, propX + 85, propY);
      }
      propY += propLineH;
    }

    drawProperty("Valency:", el.valency.toString(), "#16a34a", true);
    drawProperty("State:", el.phase.toUpperCase(), el.phase === "gas" ? "#0284c7" : el.phase === "liquid" ? "#d97706" : "#475569", true);
    
    // Shells distribution
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Shells (e⁻):", propX, propY);

    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#38bdf8" : "#0284c7";
    ctx.fillText((el.shells || []).join(", "), propX + 85, propY);

    // 5. Middle/Lower Section: Dedicated Framed Bohr Model Box
    const bohrBoxY = tileY + tileH + 12;
    const summaryH = 34;
    const bohrBoxH = y2 - bohrBoxY - summaryH - 12;

    if (bohrBoxH > 80) {
      // Sub-card container
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x1 + 14, bohrBoxY, w - 28, bohrBoxH, 8) : ctx.rect(x1 + 14, bohrBoxY, w - 28, bohrBoxH);
      ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.45)" : "#f8fafc";
      ctx.fill();
      ctx.strokeStyle = isDark ? "#334155" : "#e2e8f0";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Bohr Model Sub-Header
      ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = isDark ? "#38bdf8" : "#0369a1";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("⚛️ Bohr Electron Shells", x1 + 24, bohrBoxY + 8);

      const totalElectrons = (el.shells || []).reduce((a, b) => a + b, 0);
      ctx.textAlign = "right";
      ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.fillText(el.shells.length + " Shells · " + totalElectrons + " e⁻ Total", x2 - 24, bohrBoxY + 8);

      // Render Bohr Atom on Canvas
      const atomCanvas = document.createElement("canvas");
      const atomDim = Math.min(w - 44, bohrBoxH - 26);
      atomCanvas.width = atomDim;
      atomCanvas.height = atomDim;

      renderBohrAtom(atomCanvas, el.shells, el.symbol, el.z, isDark);

      const atomDrawX = x1 + (w - atomDim) / 2;
      ctx.drawImage(atomCanvas, atomDrawX, bohrBoxY + 22);
    }

    // 6. Bottom Summary Banner Callout
    const bannerY = y2 - summaryH - 8;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x1 + 14, bannerY, w - 28, summaryH, 6) : ctx.rect(x1 + 14, bannerY, w - 28, summaryH);
    ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.75)" : "#eff6ff";
    ctx.fill();
    ctx.strokeStyle = isDark ? "#475569" : "#bfdbfe";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "500 12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#93c5fd" : "#1e40af";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const summaryText = el.summary || (el.name + " (" + el.symbol + ")");
    ctx.fillText("💡 " + summaryText, x1 + w / 2, bannerY + summaryH / 2);

    ctx.restore();
  }

  function drawPeriodicTableShape(ctx, shape, isPreview) {
    if (!shape || !shape.start || !shape.end) return;

    const x1 = Math.min(shape.start.x, shape.end.x);
    const x2 = Math.max(shape.start.x, shape.end.x);
    const y1 = Math.min(shape.start.y, shape.end.y);
    const y2 = Math.max(shape.start.y, shape.end.y);
    const w = x2 - x1;
    const h = y2 - y1;

    if (w < 80 || h < 60) return;

    ctx.save();
    let isDark = false;
    if (typeof boardTheme === "string" && (boardTheme === "blackboard" || boardTheme === "dark")) {
      isDark = true;
    }

    // Card background
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x1, y1, w, h, 10) : ctx.rect(x1, y1, w, h);
    ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.96)" : "#ffffff";
    ctx.fill();
    ctx.strokeStyle = isDark ? "#38bdf8" : "#94a3b8";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Top Header Banner
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x1, y1, w, 28, [10, 10, 0, 0]) : ctx.rect(x1, y1, w, 28);
    ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.95)" : "#f8fafc";
    ctx.fill();
    ctx.strokeStyle = isDark ? "#475569" : "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#38bdf8" : "#0369a1";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("🔬 MODERN PERIODIC TABLE OF ELEMENTS", x1 + 14, y1 + 14);

    ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.textAlign = "right";
    ctx.fillText("18 Groups · 7 Periods · 118 Elements", x2 - 14, y1 + 14);

    // Mini grid calculation
    const cols = 18;
    const rows = 10; // row 0: groups 1..18, rows 1..7: periods 1..7, row 8: spacer, rows 9..10: Lanthanides & Actinides
    const padL = 26; // for period numbers on left
    const padR = 14;
    const padTop = 32;
    const padBottom = 22; // for legend along bottom

    const cellW = (w - padL - padR) / cols;
    const cellH = (h - padTop - padBottom) / 10.2;

    // Draw Group Numbers along the top
    ctx.font = "bold 9px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (let g = 1; g <= 18; g++) {
      const gx = x1 + padL + (g - 1) * cellW + cellW / 2;
      ctx.fillText(g.toString(), gx, y1 + padTop + 9);
    }

    // Draw Period Numbers along the left
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let p = 1; p <= 7; p++) {
      const py = y1 + padTop + 10 + (p - 1) * cellH + cellH / 2;
      ctx.fillText(p.toString(), x1 + padL - 5, py);
    }

    // Draw Elements
    elements.forEach((el) => {
      let r = el.period - 1;
      let c = el.group ? el.group - 1 : null;

      if (el.category === "lanthanide") {
        r = 7.8;
        c = (el.z - 57) + 2; // cols 3 to 17
      } else if (el.category === "actinide") {
        r = 8.8;
        c = (el.z - 89) + 2;
      }

      if (c === null || c < 0 || c >= 18) return;

      const cx = x1 + padL + c * cellW;
      const cy = y1 + padTop + 10 + r * cellH;
      const cat = CATEGORIES[el.category] || CATEGORIES.transition;

      ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.9)" : cat.bg;
      ctx.strokeStyle = cat.border;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(cx + 0.5, cy + 0.5, cellW - 1, cellH - 1, 2) : ctx.rect(cx + 0.5, cy + 0.5, cellW - 1, cellH - 1);
      ctx.fill();
      ctx.stroke();

      if (cellW > 12 && cellH > 12) {
        // Atomic number
        if (cellW > 20 && cellH > 20) {
          ctx.font = "bold " + Math.max(6, Math.min(8, Math.round(cellH * 0.28))) + "px system-ui, -apple-system, sans-serif";
          ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(el.z.toString(), cx + 2, cy + 2);
        }

        // Symbol
        ctx.font = "bold " + Math.max(8, Math.min(13, Math.round(cellH * 0.48))) + "px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = isDark ? "#f8fafc" : cat.text;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.symbol, cx + cellW / 2, cy + cellH * 0.55);
      }
    });

    // Draw Lanthanide / Actinide Indicator tags on Main Table
    ctx.font = "bold 8px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#cbd5e1" : "#64748b";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("* 57–71 Lanthanides", x1 + padL + 2 * cellW, y1 + padTop + 10 + 7.8 * cellH - 4);
    ctx.fillText("** 89–103 Actinides", x1 + padL + 2 * cellW, y1 + padTop + 10 + 8.8 * cellH - 4);

    ctx.restore();
  }

  // =========================================================================
  // 4. Modal Dialog: openPeriodicTableModal
  // =========================================================================

  let activeModalOverlay = null;
  let activeModalCloseHandler = null;

  function openPeriodicTableModal(onStampElement, onStampTable, options) {
    if (activeModalOverlay) {
      activeModalOverlay.remove();
      activeModalOverlay = null;
      activeModalCloseHandler = null;
    }

    let isFullscreen = false;
    const isStudent = Boolean(options && options.isStudent);
    let selectedZ = (options && typeof options.initialZ === "number") ? options.initialZ : 11;
    let currentFilter = "all"; // all | first20 | metal | nonmetal | metalloid | solid | liquid | gas
    let currentTrend = "none"; // none | radius | valency | metallic | electronegativity
    let searchQuery = "";

    function notifyHostState(action, z) {
      if (isStudent) return;
      try {
        const payload = {
          type: "WHITEBOARD_PERIODIC_TABLE_STATE",
          action: action,
          elementZ: typeof z === "number" ? z : selectedZ
        };
        if (typeof postMessageToHost === "function") {
          postMessageToHost(payload);
        } else if (window.parent && window.parent !== window) {
          window.parent.postMessage(payload, "*");
        }
        if (typeof BroadcastChannel !== "undefined") {
          try {
            const bc = new BroadcastChannel("eduashram_whiteboard_sync");
            bc.postMessage(payload);
            bc.close();
          } catch (_) {}
        }
      } catch (_) {}
    }

    // Automatically notify host/students that teacher opened the Periodic Table
    notifyHostState("open", selectedZ);

    // 1. Create Overlay
    const overlay = document.createElement("div");
    overlay.className = "periodic-table-modal-overlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(15, 23, 42, 0.65)";
    overlay.style.backdropFilter = "blur(4px)";
    overlay.style.zIndex = "1000000";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "10px";

    // 2. Card Container
    const card = document.createElement("div");
    card.className = "periodic-table-modal-card";
    card.style.background = "#ffffff";
    card.style.borderRadius = "12px";
    card.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.35)";
    card.style.width = "min(1360px, 98vw)";
    card.style.height = "min(880px, 94vh)";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.overflow = "hidden";
    card.style.border = "1px solid #cbd5e1";
    card.style.fontFamily = "system-ui, -apple-system, sans-serif";
    card.style.transition = "all 0.2s ease-in-out";

    overlay.appendChild(card);

    // 3. Header
    const header = document.createElement("div");
    header.style.padding = "10px 16px";
    header.style.background = "#f8fafc";
    header.style.borderBottom = "1px solid #e2e8f0";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";

    const headLeft = document.createElement("div");
    headLeft.style.display = "flex";
    headLeft.style.alignItems = "center";
    headLeft.style.gap = "10px";

    const titleH = document.createElement("h2");
    titleH.style.margin = "0";
    titleH.style.fontSize = "1.05rem";
    titleH.style.fontWeight = "700";
    titleH.style.color = "#0f172a";
    titleH.innerHTML = "🔬 Modern Periodic Table of Elements";
    headLeft.appendChild(titleH);



    header.appendChild(headLeft);

    // Header Right: Fullscreen & Close Buttons
    const headRight = document.createElement("div");
    headRight.style.display = "flex";
    headRight.style.alignItems = "center";
    headRight.style.gap = "8px";

    // Centralized closeModal function that informs students when closed
    function closeModal() {
      if (activeModalOverlay) {
        activeModalOverlay.remove();
        activeModalOverlay = null;
      }
      activeModalCloseHandler = null;
      window.removeEventListener("keydown", onKeyDown);
      notifyHostState("close");
    }

    activeModalCloseHandler = closeModal;

    if (!isStudent) {
      const shareBtn = document.createElement("button");
      shareBtn.type = "button";
      shareBtn.innerHTML = "📡 Share with Students";
      shareBtn.title = "Open this interactive Periodic Table for all students";
      shareBtn.style.padding = "5px 10px";
      shareBtn.style.fontSize = "0.76rem";
      shareBtn.style.fontWeight = "700";
      shareBtn.style.background = "#eff6ff";
      shareBtn.style.color = "#1d4ed8";
      shareBtn.style.border = "1.5px solid #bfdbfe";
      shareBtn.style.borderRadius = "6px";
      shareBtn.style.cursor = "pointer";
      shareBtn.addEventListener("click", () => {
        notifyHostState("open", selectedZ);
        shareBtn.innerHTML = "✓ Shared with Students!";
        shareBtn.style.background = "#ecfdf5";
        shareBtn.style.color = "#047857";
        shareBtn.style.borderColor = "#a7f3d0";
        setTimeout(() => {
          shareBtn.innerHTML = "📡 Share with Students";
          shareBtn.style.background = "#eff6ff";
          shareBtn.style.color = "#1d4ed8";
          shareBtn.style.borderColor = "#bfdbfe";
        }, 2500);
      });
      headRight.appendChild(shareBtn);
    }

    const fsBtn = document.createElement("button");
    fsBtn.type = "button";
    fsBtn.innerHTML = "⛶ Fullscreen";
    fsBtn.title = "Toggle Fullscreen Window";
    fsBtn.style.padding = "5px 10px";
    fsBtn.style.fontSize = "0.76rem";
    fsBtn.style.fontWeight = "600";
    fsBtn.style.background = "#ffffff";
    fsBtn.style.color = "#334155";
    fsBtn.style.border = "1px solid #cbd5e1";
    fsBtn.style.borderRadius = "6px";
    fsBtn.style.cursor = "pointer";

    fsBtn.addEventListener("click", () => {
      isFullscreen = !isFullscreen;
      if (isFullscreen) {
        card.style.width = "100vw";
        card.style.height = "100vh";
        card.style.borderRadius = "0";
        overlay.style.padding = "0";
        fsBtn.innerHTML = "⤢ Exit Fullscreen";
      } else {
        card.style.width = "min(1360px, 98vw)";
        card.style.height = "min(880px, 94vh)";
        card.style.borderRadius = "12px";
        overlay.style.padding = "10px";
        fsBtn.innerHTML = "⛶ Fullscreen";
      }
    });
    headRight.appendChild(fsBtn);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.innerHTML = "✕";
    closeBtn.title = "Close (Esc)";
    closeBtn.style.padding = "4px 9px";
    closeBtn.style.fontSize = "0.88rem";
    closeBtn.style.fontWeight = "700";
    closeBtn.style.background = "transparent";
    closeBtn.style.color = "#64748b";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.cursor = "pointer";
    closeBtn.addEventListener("click", () => {
      closeModal();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
    headRight.appendChild(closeBtn);
    header.appendChild(headRight);
    card.appendChild(header);

    // 4. Filter & Controls Toolbar
    const toolbar = document.createElement("div");
    toolbar.style.padding = "8px 16px";
    toolbar.style.background = "#f1f5f9";
    toolbar.style.borderBottom = "1px solid #e2e8f0";
    toolbar.style.display = "flex";
    toolbar.style.flexWrap = "wrap";
    toolbar.style.alignItems = "center";
    toolbar.style.justifyContent = "space-between";
    toolbar.style.gap = "8px";

    // Search Box
    const searchIn = document.createElement("input");
    searchIn.type = "text";
    searchIn.placeholder = "🔍 Search element (e.g. Carbon, Fe, 26)...";
    searchIn.style.padding = "4px 10px";
    searchIn.style.fontSize = "0.78rem";
    searchIn.style.borderRadius = "6px";
    searchIn.style.border = "1px solid #cbd5e1";
    searchIn.style.width = "220px";
    searchIn.style.boxSizing = "border-box";
    searchIn.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      updateGridHighlights();
    });
    toolbar.appendChild(searchIn);

    // Quick Filter Buttons
    const filterPills = document.createElement("div");
    filterPills.style.display = "flex";
    filterPills.style.alignItems = "center";
    filterPills.style.gap = "4px";
    filterPills.style.flexWrap = "wrap";

    const filters = [
      { id: "all", label: "All 118" },
      { id: "first20", label: "⭐ First 20 Elements (Class 9/10)" },
      { id: "metal", label: "Metals" },
      { id: "nonmetal", label: "Non-Metals" },
      { id: "metalloid", label: "Metalloids" }
    ];

    filters.forEach((f) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = f.label;
      btn.style.padding = "3px 8px";
      btn.style.fontSize = "0.74rem";
      btn.style.fontWeight = "600";
      btn.style.borderRadius = "5px";
      btn.style.cursor = "pointer";

      function updatePillStyle() {
        const isActive = currentFilter === f.id;
        btn.style.background = isActive ? (f.id === "first20" ? "#fef08a" : "#0284c7") : "#ffffff";
        btn.style.color = isActive ? (f.id === "first20" ? "#854d0e" : "#ffffff") : "#475569";
        btn.style.border = isActive ? (f.id === "first20" ? "1.5px solid #eab308" : "1.5px solid #0284c7") : "1px solid #cbd5e1";
      }
      updatePillStyle();

      btn.addEventListener("click", () => {
        currentFilter = f.id;
        Array.from(filterPills.children).forEach((c) => c._refresh && c._refresh());
        updateGridHighlights();
      });
      btn._refresh = updatePillStyle;
      filterPills.appendChild(btn);
    });
    toolbar.appendChild(filterPills);

    // Periodic Trends Dropdown
    const trendWrap = document.createElement("div");
    trendWrap.style.display = "flex";
    trendWrap.style.alignItems = "center";
    trendWrap.style.gap = "6px";

    const trendLbl = document.createElement("span");
    trendLbl.style.fontSize = "0.74rem";
    trendLbl.style.fontWeight = "600";
    trendLbl.style.color = "#475569";
    trendLbl.textContent = "NCERT Trends:";
    trendWrap.appendChild(trendLbl);

    const trendSel = document.createElement("select");
    trendSel.style.padding = "4px 8px";
    trendSel.style.fontSize = "0.75rem";
    trendSel.style.borderRadius = "5px";
    trendSel.style.border = "1px solid #cbd5e1";
    trendSel.style.background = "#ffffff";
    trendSel.style.color = "#0f172a";

    [
      { id: "none", label: "Standard Families" },
      { id: "radius", label: "Atomic Radius (Size: pm)" },
      { id: "valency", label: "Valency (1 → 4 → 0)" },
      { id: "metallic", label: "Metallic Character" },
      { id: "electronegativity", label: "Electronegativity (Pauling)" }
    ].forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.label;
      trendSel.appendChild(opt);
    });

    trendSel.addEventListener("change", (e) => {
      currentTrend = e.target.value;
      updateGridHighlights();
    });
    trendWrap.appendChild(trendSel);
    toolbar.appendChild(trendWrap);

    card.appendChild(toolbar);

    // 5. Main Body (Two Columns: Table Grid on Left, Inspector on Right)
    const body = document.createElement("div");
    body.style.display = "flex";
    body.style.flex = "1";
    body.style.overflow = "hidden";

    // Left Column: Periodic Table Grid Container
    const gridContainer = document.createElement("div");
    gridContainer.style.flex = "1";
    gridContainer.style.overflow = "auto";
    gridContainer.style.padding = "10px 14px";
    gridContainer.style.background = "#f8fafc";
    body.appendChild(gridContainer);

    // Right Column: Element Inspector & Bohr Atom Model
    const inspector = document.createElement("div");
    inspector.style.width = "300px";
    inspector.style.maxWidth = "35%";
    inspector.style.borderLeft = "1px solid #e2e8f0";
    inspector.style.background = "#ffffff";
    inspector.style.display = "flex";
    inspector.style.flexDirection = "column";
    inspector.style.overflowY = "auto";
    inspector.style.padding = "12px";
    body.appendChild(inspector);

    card.appendChild(body);

    // 6. Build the Periodic Table Grid
    const tableWrap = document.createElement("div");
    tableWrap.style.display = "grid";
    tableWrap.style.gridTemplateColumns = "repeat(18, minmax(44px, 1fr))";
    tableWrap.style.gridTemplateRows = "repeat(7, minmax(48px, 1fr)) 14px repeat(2, minmax(48px, 1fr))";
    tableWrap.style.gap = "3px";
    tableWrap.style.minWidth = "840px";
    gridContainer.appendChild(tableWrap);

    // Keep references to tile elements
    const tileElements = {};

    elements.forEach((el) => {
      const tile = document.createElement("div");
      tile.style.borderRadius = "5px";
      tile.style.border = "1px solid #cbd5e1";
      tile.style.padding = "2px 4px";
      tile.style.cursor = "pointer";
      tile.style.display = "flex";
      tile.style.flexDirection = "column";
      tile.style.justifyContent = "space-between";
      tile.style.position = "relative";
      tile.style.transition = "transform 0.1s, box-shadow 0.1s";
      tile.style.userSelect = "none";

      let gridCol = el.group;
      let gridRow = el.period;

      if (el.category === "lanthanide") {
        gridRow = 9;
        gridCol = (el.z - 57) + 3;
      } else if (el.category === "actinide") {
        gridRow = 10;
        gridCol = (el.z - 89) + 3;
      }

      tile.style.gridColumn = gridCol.toString();
      tile.style.gridRow = gridRow.toString();

      // Top row: atomic number & mass
      const topRow = document.createElement("div");
      topRow.style.display = "flex";
      topRow.style.justifyContent = "space-between";
      topRow.style.fontSize = "0.62rem";
      topRow.style.color = "#64748b";

      const zSpan = document.createElement("span");
      zSpan.style.fontWeight = "700";
      zSpan.textContent = el.z.toString();
      topRow.appendChild(zSpan);

      const massSpan = document.createElement("span");
      massSpan.textContent = Math.round(el.mass).toString();
      topRow.appendChild(massSpan);
      tile.appendChild(topRow);

      // Symbol
      const symSpan = document.createElement("div");
      symSpan.style.fontWeight = "800";
      symSpan.style.fontSize = "0.95rem";
      symSpan.style.textAlign = "center";
      symSpan.style.lineHeight = "1.1";
      symSpan.textContent = el.symbol;
      tile.appendChild(symSpan);

      // Name
      const nameSpan = document.createElement("div");
      nameSpan.style.fontSize = "0.58rem";
      nameSpan.style.textAlign = "center";
      nameSpan.style.whiteSpace = "nowrap";
      nameSpan.style.overflow = "hidden";
      nameSpan.style.textOverflow = "ellipsis";
      nameSpan.textContent = el.name;
      tile.appendChild(nameSpan);

      // Click to select
      tile.addEventListener("click", () => {
        selectedZ = el.z;
        renderInspector();
        updateGridHighlights();
      });

      // Hover
      tile.addEventListener("mouseenter", () => {
        tile.style.transform = "scale(1.08)";
        tile.style.zIndex = "10";
        tile.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
      });
      tile.addEventListener("mouseleave", () => {
        tile.style.transform = "none";
        tile.style.zIndex = "1";
        tile.style.boxShadow = "none";
      });

      tileElements[el.z] = tile;
      tableWrap.appendChild(tile);
    });

    // Lanthanide & Actinide placeholders in Main Grid
    function makePlaceholder(text, row, col) {
      const ph = document.createElement("div");
      ph.style.gridColumn = col.toString();
      ph.style.gridRow = row.toString();
      ph.style.borderRadius = "5px";
      ph.style.border = "1px dashed #cbd5e1";
      ph.style.background = "#f1f5f9";
      ph.style.display = "flex";
      ph.style.alignItems = "center";
      ph.style.justifyContent = "center";
      ph.style.fontSize = "0.65rem";
      ph.style.fontWeight = "700";
      ph.style.color = "#64748b";
      ph.textContent = text;
      tableWrap.appendChild(ph);
    }
    makePlaceholder("57–71 *", 6, 3);
    makePlaceholder("89–103 **", 7, 3);

    // 7. Update Grid Colors and Highlights based on Filter & Trend
    function updateGridHighlights() {
      elements.forEach((el) => {
        const tile = tileElements[el.z];
        if (!tile) return;

        const cat = CATEGORIES[el.category] || CATEGORIES.transition;
        let isDimmed = false;

        // Search match
        if (searchQuery) {
          const matchZ = el.z.toString() === searchQuery;
          const matchSym = el.symbol.toLowerCase() === searchQuery;
          const matchName = el.name.toLowerCase().includes(searchQuery);
          if (!matchZ && !matchSym && !matchName) isDimmed = true;
        }

        // Filter match
        if (!isDimmed) {
          if (currentFilter === "first20" && el.z > 20) isDimmed = true;
          else if (currentFilter === "metal" && !["alkali", "alkaline", "transition", "post_transition", "lanthanide", "actinide"].includes(el.category)) isDimmed = true;
          else if (currentFilter === "nonmetal" && !["nonmetal", "halogen", "noble"].includes(el.category)) isDimmed = true;
          else if (currentFilter === "metalloid" && el.category !== "metalloid") isDimmed = true;
        }

        tile.style.opacity = isDimmed ? "0.22" : "1";

        // Trend Styling
        if (currentTrend === "radius" && el.radius) {
          // Heatmap from small (blue) to large (red/amber)
          const normR = Math.min(1, Math.max(0, (el.radius - 30) / 240));
          tile.style.background = "hsl(" + Math.round((1 - normR) * 220) + ", 75%, 90%)";
          tile.style.color = "#0f172a";
          tile.style.border = "1px solid #94a3b8";
        } else if (currentTrend === "valency") {
          const valColors = {
            0: "#f1f5f9", 1: "#dbeafe", 2: "#dcfce7", 3: "#fef3c7", 4: "#ffedd5",
            5: "#fce7f3", 6: "#fae8ff", 7: "#ede9fe", 8: "#e0e7ff"
          };
          tile.style.background = valColors[el.valency] || "#f8fafc";
          tile.style.color = "#0f172a";
          tile.style.border = "1px solid #cbd5e1";
        } else if (currentTrend === "electronegativity" && el.electronegativity) {
          const normEN = Math.min(1, Math.max(0, (el.electronegativity - 0.7) / 3.3));
          tile.style.background = "hsl(" + Math.round(normEN * 340) + ", 80%, 92%)";
          tile.style.color = "#0f172a";
          tile.style.border = "1px solid #94a3b8";
        } else {
          // Standard Category Colors
          tile.style.background = cat.bg;
          tile.style.color = cat.text;
          tile.style.border = "1px solid " + cat.border;
        }

        // Selected Border
        if (el.z === selectedZ) {
          tile.style.outline = "2.5px solid #0284c7";
          tile.style.boxShadow = "0 0 10px rgba(2, 132, 199, 0.45)";
        } else {
          tile.style.outline = "none";
          tile.style.boxShadow = "none";
        }
      });
    }

    // 8. Render Right Column: Element Inspector
    function renderInspector() {
      inspector.innerHTML = "";

      const el = elements.find((e) => e.z === selectedZ) || elements[10];
      const cat = CATEGORIES[el.category] || CATEGORIES.alkali;

      // Header Box
      const iHead = document.createElement("div");
      iHead.style.padding = "8px";
      iHead.style.background = cat.bg;
      iHead.style.border = "1.5px solid " + cat.border;
      iHead.style.borderRadius = "8px";
      iHead.style.marginBottom = "10px";
      iHead.style.display = "flex";
      iHead.style.justifyContent = "space-between";
      iHead.style.alignItems = "center";

      const iHeadLeft = document.createElement("div");
      const iSym = document.createElement("span");
      iSym.style.fontSize = "1.6rem";
      iSym.style.fontWeight = "800";
      iSym.style.color = cat.text;
      iSym.textContent = el.symbol;
      iHeadLeft.appendChild(iSym);

      const iName = document.createElement("div");
      iName.style.fontSize = "0.85rem";
      iName.style.fontWeight = "700";
      iName.style.color = "#0f172a";
      iName.textContent = el.name;
      iHeadLeft.appendChild(iName);
      iHead.appendChild(iHeadLeft);

      const iHeadRight = document.createElement("div");
      iHeadRight.style.textAlign = "right";
      iHeadRight.style.fontSize = "0.72rem";
      iHeadRight.style.color = "#475569";
      iHeadRight.innerHTML = "<b>Z = " + el.z + "</b><br>Mass: " + el.mass + " u";
      iHead.appendChild(iHeadRight);

      inspector.appendChild(iHead);

      // Category Pill
      const catPill = document.createElement("div");
      catPill.style.fontSize = "0.72rem";
      catPill.style.fontWeight = "600";
      catPill.style.color = cat.text;
      catPill.style.marginBottom = "8px";
      catPill.textContent = cat.label + " · Period " + el.period + (el.group ? " · Group " + el.group : "");
      inspector.appendChild(catPill);

      // Bohr Atom Model Card (Second Card in Inspector)
      const bohrWrap = document.createElement("div");
      bohrWrap.style.display = "flex";
      bohrWrap.style.flexDirection = "column";
      bohrWrap.style.alignItems = "center";
      bohrWrap.style.padding = "8px 10px";
      bohrWrap.style.background = "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)";
      bohrWrap.style.border = "1.5px solid #cbd5e1";
      bohrWrap.style.borderRadius = "10px";
      bohrWrap.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.04)";
      bohrWrap.style.marginBottom = "12px";

      // Header inside Bohr Card
      const bohrHeader = document.createElement("div");
      bohrHeader.style.display = "flex";
      bohrHeader.style.justifyContent = "space-between";
      bohrHeader.style.alignItems = "center";
      bohrHeader.style.width = "100%";
      bohrHeader.style.marginBottom = "4px";

      const bohrTitle = document.createElement("span");
      bohrTitle.style.fontWeight = "700";
      bohrTitle.style.fontSize = "0.78rem";
      bohrTitle.style.color = "#0369a1";
      bohrTitle.style.display = "flex";
      bohrTitle.style.alignItems = "center";
      bohrTitle.style.gap = "5px";
      bohrTitle.innerHTML = "⚛️ Bohr Electron Shells";
      bohrHeader.appendChild(bohrTitle);

      const totalE = (el.shells || []).reduce((a, b) => a + b, 0);
      const eBadge = document.createElement("span");
      eBadge.style.fontSize = "0.68rem";
      eBadge.style.fontWeight = "700";
      eBadge.style.color = "#0284c7";
      eBadge.style.background = "#e0f2fe";
      eBadge.style.padding = "2px 7px";
      eBadge.style.borderRadius = "4px";
      eBadge.style.border = "1px solid #bae6fd";
      eBadge.textContent = totalE + " e⁻ Total";
      bohrHeader.appendChild(eBadge);
      bohrWrap.appendChild(bohrHeader);

      const bohrCanvas = document.createElement("canvas");
      bohrCanvas.width = 186;
      bohrCanvas.height = 186;
      renderBohrAtom(bohrCanvas, el.shells, el.symbol, el.z, false);
      bohrWrap.appendChild(bohrCanvas);

      // Shells Pills Row
      const pillsRow = document.createElement("div");
      pillsRow.style.display = "flex";
      pillsRow.style.flexWrap = "wrap";
      pillsRow.style.justifyContent = "center";
      pillsRow.style.gap = "5px";
      pillsRow.style.marginTop = "6px";
      pillsRow.style.width = "100%";

      (el.shells || []).forEach((c, i) => {
        const sPill = document.createElement("span");
        sPill.style.fontSize = "0.72rem";
        sPill.style.fontWeight = "700";
        sPill.style.color = "#0369a1";
        sPill.style.background = "#ffffff";
        sPill.style.border = "1.5px solid #bae6fd";
        sPill.style.padding = "2px 7px";
        sPill.style.borderRadius = "5px";
        sPill.style.boxShadow = "0 1px 2px rgba(0,0,0,0.03)";
        sPill.textContent = SHELL_NAMES[i] + " = " + c;
        pillsRow.appendChild(sPill);
      });
      bohrWrap.appendChild(pillsRow);

      inspector.appendChild(bohrWrap);

      // Key NCERT Properties List
      const propBox = document.createElement("div");
      propBox.style.display = "flex";
      propBox.style.flexDirection = "column";
      propBox.style.gap = "4px";
      propBox.style.marginBottom = "12px";

      function addRow(label, val, valCol) {
        const r = document.createElement("div");
        r.style.display = "flex";
        r.style.justifyContent = "space-between";
        r.style.fontSize = "0.74rem";
        r.style.padding = "2px 0";
        r.style.borderBottom = "1px solid #f1f5f9";

        const l = document.createElement("span");
        l.style.color = "#64748b";
        l.textContent = label;
        r.appendChild(l);

        const v = document.createElement("span");
        v.style.fontWeight = "700";
        v.style.color = valCol || "#0f172a";
        v.textContent = val;
        r.appendChild(v);
        propBox.appendChild(r);
      }

      addRow("Valency", el.valency.toString(), "#16a34a");
      addRow("Valence Electrons", el.shells ? el.shells[el.shells.length - 1].toString() : "1");
      
      addRow("State at STP", el.phase.toUpperCase());
      if (el.radius) addRow("Atomic Radius", el.radius + " pm");
      if (el.electronegativity) addRow("Electronegativity", el.electronegativity.toString());

      inspector.appendChild(propBox);

      // NCERT Curriculum Summary Note
      const noteBox = document.createElement("div");
      noteBox.style.padding = "6px 8px";
      noteBox.style.background = "#eff6ff";
      noteBox.style.border = "1px solid #bfdbfe";
      noteBox.style.borderRadius = "6px";
      noteBox.style.fontSize = "0.72rem";
      noteBox.style.color = "#1e40af";
      noteBox.style.lineHeight = "1.35";
      noteBox.style.marginBottom = "12px";
      noteBox.textContent = el.summary || "";
      inspector.appendChild(noteBox);

      // Action Buttons
      const btnCol = document.createElement("div");
      btnCol.style.display = "flex";
      btnCol.style.flexDirection = "column";
      btnCol.style.gap = "6px";
      btnCol.style.marginTop = "auto";

      if (isStudent || (!onStampElement && !onStampTable)) {
        const studentTip = document.createElement("div");
        studentTip.style.padding = "9px 11px";
        studentTip.style.background = "#f0fdf4";
        studentTip.style.border = "1.5px solid #bbf7d0";
        studentTip.style.borderRadius = "8px";
        studentTip.style.fontSize = "0.76rem";
        studentTip.style.color = "#166534";
        studentTip.style.lineHeight = "1.4";
        studentTip.style.fontWeight = "600";
        studentTip.innerHTML = "👆 <b>Interactive Mode:</b> Tap any element in the table to inspect its Bohr electron shells, valency, and properties!";
        btnCol.appendChild(studentTip);
      } else {
      const stampCardBtn = document.createElement("button");
      stampCardBtn.type = "button";
      stampCardBtn.innerHTML = "📋 Stamp Element Card on Board";
      stampCardBtn.style.padding = "8px";
      stampCardBtn.style.background = "#0284c7";
      stampCardBtn.style.color = "#ffffff";
      stampCardBtn.style.fontWeight = "700";
      stampCardBtn.style.fontSize = "0.80rem";
      stampCardBtn.style.border = "none";
      stampCardBtn.style.borderRadius = "6px";
      stampCardBtn.style.cursor = "pointer";
      stampCardBtn.addEventListener("click", () => {
        if (typeof onStampElement === "function") {
          onStampElement(el);
          closeModal();
        }
      });
      btnCol.appendChild(stampCardBtn);

      const stampTableBtn = document.createElement("button");
      stampTableBtn.type = "button";
      stampTableBtn.innerHTML = "📊 Stamp Periodic Table on Board";
      stampTableBtn.style.padding = "8px";
      stampTableBtn.style.background = "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)";
      stampTableBtn.style.color = "#1e293b";
      stampTableBtn.style.fontWeight = "700";
      stampTableBtn.style.fontSize = "0.80rem";
      stampTableBtn.style.border = "1.5px solid #cbd5e1";
      stampTableBtn.style.borderRadius = "6px";
      stampTableBtn.style.cursor = "pointer";
      stampTableBtn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
      stampTableBtn.addEventListener("click", () => {
        if (typeof onStampTable === "function") {
          onStampTable();
          closeModal();
        }
      });
      btnCol.appendChild(stampTableBtn);
      }

      inspector.appendChild(btnCol);
    }

    renderInspector();
    updateGridHighlights();

    // Escape key to close
    function onKeyDown(e) {
      if (e.key === "Escape") {
        closeModal();
      }
    }
    window.addEventListener("keydown", onKeyDown);

    document.body.appendChild(overlay);
    activeModalOverlay = overlay;
  }

  // =========================================================================
  // 5. Global Export
  // =========================================================================

  function closePeriodicTableModal() {
    if (activeModalCloseHandler) {
      activeModalCloseHandler();
    } else if (activeModalOverlay) {
      activeModalOverlay.remove();
      activeModalOverlay = null;
    }
  }

  function isModalOpen() {
    return Boolean(activeModalOverlay);
  }

  window.EduAshramPeriodicTable = {
    elements,
    CATEGORIES,
    renderBohrAtom,
    drawElementCardShape,
    drawPeriodicTableShape,
    openPeriodicTableModal,
    closePeriodicTableModal,
    isModalOpen
  };

  console.log("EduAshram Periodic Table Engine loaded successfully (118 elements ready).");
})();
