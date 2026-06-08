// Complete JEE Mains 2026 Syllabus - Chapters and Topics

export interface TopicData {
  topics: string[];
}

export interface SubjectData {
  chapters: {
    [chapterName: string]: string[];
  };
}

export const JEE_SYLLABUS: { [subject: string]: SubjectData } = {
  Physics: {
    chapters: {
      "Units and Measurement": [
        "SI Units",
        "Dimensions and Dimensional Analysis",
        "Errors in Measurement",
        "Significant Figures",
        "Vernier Calipers",
        "Screw Gauge"
      ],
      "Kinematics": [
        "Motion in a Straight Line",
        "Motion in a Plane",
        "Projectile Motion",
        "Relative Motion",
        "Graphs of Motion",
        "Equations of Motion"
      ],
      "Laws of Motion": [
        "Newton's First Law",
        "Newton's Second Law",
        "Newton's Third Law",
        "Friction",
        "Circular Motion",
        "Free Body Diagrams",
        "Pseudo Forces"
      ],
      "Work, Energy and Power": [
        "Work Done by a Force",
        "Kinetic Energy",
        "Potential Energy",
        "Work-Energy Theorem",
        "Conservation of Energy",
        "Power",
        "Collisions"
      ],
      "Rotational Motion": [
        "Moment of Inertia",
        "Torque",
        "Angular Momentum",
        "Rolling Motion",
        "Centre of Mass",
        "Rotational Kinetic Energy",
        "Parallel and Perpendicular Axis Theorem"
      ],
      "Gravitation": [
        "Newton's Law of Gravitation",
        "Gravitational Field and Potential",
        "Kepler's Laws",
        "Orbital Velocity",
        "Escape Velocity",
        "Satellites",
        "Gravitational Potential Energy"
      ],
      "Properties of Solids and Liquids": [
        "Elasticity",
        "Young's Modulus",
        "Bulk Modulus",
        "Shear Modulus",
        "Surface Tension",
        "Viscosity",
        "Bernoulli's Theorem",
        "Capillary Action"
      ],
      "Thermodynamics": [
        "First Law of Thermodynamics",
        "Second Law of Thermodynamics",
        "Isothermal Process",
        "Adiabatic Process",
        "Heat Engines",
        "Refrigerators",
        "Carnot Cycle",
        "Entropy"
      ],
      "Kinetic Theory of Gases": [
        "Ideal Gas Equation",
        "Kinetic Theory Assumptions",
        "RMS Speed",
        "Degrees of Freedom",
        "Specific Heat Capacities",
        "Mean Free Path"
      ],
      "Oscillations and Waves": [
        "Simple Harmonic Motion",
        "Damped Oscillations",
        "Forced Oscillations",
        "Resonance",
        "Wave Motion",
        "Superposition of Waves",
        "Standing Waves",
        "Beats",
        "Doppler Effect"
      ],
      "Electrostatics": [
        "Coulomb's Law",
        "Electric Field",
        "Electric Potential",
        "Gauss's Law",
        "Capacitance",
        "Parallel Plate Capacitor",
        "Dielectrics",
        "Energy Stored in Capacitor"
      ],
      "Current Electricity": [
        "Ohm's Law",
        "Resistance and Resistivity",
        "Kirchhoff's Laws",
        "Wheatstone Bridge",
        "Potentiometer",
        "EMF and Internal Resistance",
        "Electrical Power"
      ],
      "Magnetic Effects of Current and Magnetism": [
        "Biot-Savart Law",
        "Ampere's Law",
        "Magnetic Force on Current",
        "Magnetic Dipole",
        "Moving Coil Galvanometer",
        "Earth's Magnetism",
        "Para, Dia and Ferromagnetism"
      ],
      "Electromagnetic Induction and AC": [
        "Faraday's Law",
        "Lenz's Law",
        "Self Inductance",
        "Mutual Inductance",
        "AC Circuits",
        "LCR Circuits",
        "Resonance in AC",
        "Transformers"
      ],
      "Electromagnetic Waves": [
        "Displacement Current",
        "Maxwell's Equations",
        "EM Wave Properties",
        "EM Spectrum",
        "Applications of EM Waves"
      ],
      "Optics": [
        "Reflection of Light",
        "Refraction of Light",
        "Total Internal Reflection",
        "Lenses",
        "Mirrors",
        "Optical Instruments",
        "Wave Optics",
        "Interference",
        "Diffraction",
        "Polarization"
      ],
      "Dual Nature of Matter and Radiation": [
        "Photoelectric Effect",
        "Einstein's Equation",
        "de Broglie Wavelength",
        "Davisson-Germer Experiment",
        "Matter Waves"
      ],
      "Atoms and Nuclei": [
        "Bohr Model",
        "Hydrogen Spectrum",
        "Radioactivity",
        "Alpha, Beta, Gamma Decay",
        "Nuclear Fission",
        "Nuclear Fusion",
        "Mass-Energy Equivalence",
        "Binding Energy"
      ],
      "Electronic Devices": [
        "Semiconductors",
        "p-n Junction Diode",
        "Zener Diode",
        "LED",
        "Photodiode",
        "Transistor",
        "Logic Gates"
      ]
    }
  },
  Chemistry: {
    chapters: {
      "Some Basic Concepts in Chemistry": [
        "Mole Concept",
        "Stoichiometry",
        "Limiting Reagent",
        "Percentage Composition",
        "Empirical and Molecular Formula",
        "Laws of Chemical Combination"
      ],
      "Atomic Structure": [
        "Bohr's Model",
        "Quantum Numbers",
        "Electronic Configuration",
        "Aufbau Principle",
        "Pauli Exclusion Principle",
        "Hund's Rule",
        "Orbitals and Shapes"
      ],
      "Chemical Bonding and Molecular Structure": [
        "Ionic Bonding",
        "Covalent Bonding",
        "VSEPR Theory",
        "Hybridization",
        "Molecular Orbital Theory",
        "Hydrogen Bonding",
        "Bond Parameters"
      ],
      "Chemical Thermodynamics": [
        "First Law of Thermodynamics",
        "Enthalpy",
        "Hess's Law",
        "Entropy",
        "Gibbs Free Energy",
        "Spontaneity"
      ],
      "Solutions": [
        "Concentration Terms",
        "Raoult's Law",
        "Colligative Properties",
        "Osmotic Pressure",
        "Van't Hoff Factor",
        "Ideal and Non-ideal Solutions"
      ],
      "Equilibrium": [
        "Chemical Equilibrium",
        "Law of Mass Action",
        "Le Chatelier's Principle",
        "Ionic Equilibrium",
        "Acids and Bases",
        "pH and pOH",
        "Buffer Solutions",
        "Solubility Product"
      ],
      "Redox Reactions and Electrochemistry": [
        "Oxidation and Reduction",
        "Balancing Redox Reactions",
        "Electrolytic Cells",
        "Galvanic Cells",
        "Nernst Equation",
        "Conductance",
        "Faraday's Laws"
      ],
      "Chemical Kinetics": [
        "Rate of Reaction",
        "Order of Reaction",
        "Rate Law",
        "Integrated Rate Equations",
        "Half Life",
        "Arrhenius Equation",
        "Activation Energy"
      ],
      "Classification of Elements and Periodicity": [
        "Modern Periodic Table",
        "Periodic Trends",
        "Atomic Radius",
        "Ionization Energy",
        "Electron Affinity",
        "Electronegativity"
      ],
      "p-Block Elements": [
        "Group 13 Elements",
        "Group 14 Elements",
        "Group 15 Elements",
        "Group 16 Elements",
        "Group 17 Elements",
        "Group 18 Elements",
        "Oxides and Oxyacids",
        "Interhalogen Compounds"
      ],
      "d and f Block Elements": [
        "Transition Elements",
        "Electronic Configuration",
        "Oxidation States",
        "Magnetic Properties",
        "Catalytic Properties",
        "Interstitial Compounds",
        "Lanthanides and Actinides"
      ],
      "Coordination Compounds": [
        "Werner's Theory",
        "IUPAC Nomenclature",
        "Isomerism",
        "Valence Bond Theory",
        "Crystal Field Theory",
        "Applications"
      ],
      "Purification and Characterisation of Organic Compounds": [
        "Purification Methods",
        "Qualitative Analysis",
        "Quantitative Analysis",
        "Detection of Elements"
      ],
      "Basic Principles of Organic Chemistry": [
        "IUPAC Nomenclature",
        "Isomerism",
        "Electronic Effects",
        "Inductive Effect",
        "Resonance",
        "Hyperconjugation",
        "Reaction Intermediates"
      ],
      "Hydrocarbons": [
        "Alkanes",
        "Alkenes",
        "Alkynes",
        "Aromatic Hydrocarbons",
        "Benzene",
        "Electrophilic Substitution",
        "Directive Effects"
      ],
      "Organic Compounds Containing Halogens": [
        "Haloalkanes",
        "Haloarenes",
        "SN1 and SN2 Reactions",
        "Elimination Reactions",
        "Grignard Reagent"
      ],
      "Organic Compounds Containing Oxygen": [
        "Alcohols",
        "Phenols",
        "Ethers",
        "Aldehydes",
        "Ketones",
        "Carboxylic Acids",
        "Nucleophilic Addition"
      ],
      "Organic Compounds Containing Nitrogen": [
        "Amines",
        "Diazonium Salts",
        "Cyanides",
        "Isocyanides",
        "Nitro Compounds"
      ],
      "Biomolecules": [
        "Carbohydrates",
        "Proteins",
        "Amino Acids",
        "Enzymes",
        "Vitamins",
        "Nucleic Acids",
        "Lipids"
      ]
    }
  },
  Mathematics: {
    chapters: {
      "Sets, Relations and Functions": [
        "Types of Sets",
        "Venn Diagrams",
        "Types of Relations",
        "Types of Functions",
        "Composition of Functions",
        "Inverse Functions"
      ],
      "Complex Numbers": [
        "Algebra of Complex Numbers",
        "Argand Plane",
        "Modulus and Argument",
        "Polar Form",
        "De Moivre's Theorem",
        "Roots of Complex Numbers"
      ],
      "Quadratic Equations": [
        "Roots of Quadratic Equations",
        "Nature of Roots",
        "Relation Between Roots and Coefficients",
        "Equations Reducible to Quadratic",
        "Maximum and Minimum Values"
      ],
      "Matrices and Determinants": [
        "Types of Matrices",
        "Matrix Operations",
        "Transpose and Adjoint",
        "Inverse of Matrix",
        "Properties of Determinants",
        "Cramer's Rule",
        "System of Linear Equations"
      ],
      "Permutations and Combinations": [
        "Fundamental Principle of Counting",
        "Permutations",
        "Combinations",
        "Circular Permutations",
        "Division into Groups"
      ],
      "Binomial Theorem": [
        "Binomial Expansion",
        "General Term",
        "Middle Term",
        "Binomial Coefficients",
        "Applications"
      ],
      "Sequence and Series": [
        "Arithmetic Progression",
        "Geometric Progression",
        "Harmonic Progression",
        "AGP",
        "Sum of Series",
        "Special Series"
      ],
      "Limits, Continuity and Differentiability": [
        "Limits",
        "Indeterminate Forms",
        "L'Hospital's Rule",
        "Continuity",
        "Differentiability",
        "Derivatives"
      ],
      "Applications of Derivatives": [
        "Tangent and Normal",
        "Rate of Change",
        "Maxima and Minima",
        "Mean Value Theorems",
        "Rolle's Theorem",
        "LMVT"
      ],
      "Integral Calculus": [
        "Indefinite Integrals",
        "Methods of Integration",
        "Definite Integrals",
        "Properties of Definite Integrals",
        "Area Under Curves",
        "Differential Equations"
      ],
      "Differential Equations": [
        "Order and Degree",
        "Formation of DE",
        "Variable Separable",
        "Homogeneous DE",
        "Linear DE",
        "Applications"
      ],
      "Coordinate Geometry": [
        "Straight Lines",
        "Circle",
        "Parabola",
        "Ellipse",
        "Hyperbola",
        "Pair of Straight Lines"
      ],
      "Three Dimensional Geometry": [
        "Direction Cosines and Ratios",
        "Equation of Line",
        "Equation of Plane",
        "Distance Formulas",
        "Angle Between Lines and Planes",
        "Shortest Distance"
      ],
      "Vector Algebra": [
        "Types of Vectors",
        "Vector Addition",
        "Scalar Product",
        "Vector Product",
        "Triple Product",
        "Applications"
      ],
      "Statistics and Probability": [
        "Mean, Median, Mode",
        "Variance and Standard Deviation",
        "Probability",
        "Conditional Probability",
        "Bayes' Theorem",
        "Random Variables",
        "Probability Distributions"
      ],
      "Trigonometry": [
        "Trigonometric Ratios",
        "Trigonometric Identities",
        "Trigonometric Equations",
        "Inverse Trigonometric Functions",
        "Properties of Triangles",
        "Heights and Distances"
      ]
    }
  }
};

// Helper function to get chapters for a subject
export function getChaptersForSubject(subject: string): string[] {
  const subjectData = JEE_SYLLABUS[subject];
  if (!subjectData) return [];
  return Object.keys(subjectData.chapters);
}

// Helper function to get topics for a chapter
export function getTopicsForChapter(subject: string, chapter: string): string[] {
  const subjectData = JEE_SYLLABUS[subject];
  if (!subjectData) return [];
  return subjectData.chapters[chapter] || [];
}

// Get all subjects
export function getSubjects(): string[] {
  return Object.keys(JEE_SYLLABUS);
}
