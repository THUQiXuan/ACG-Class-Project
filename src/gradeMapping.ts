export const gradeMapping: { [key: number]: string } = {
    0: 'A+',
    1: 'A',
    2: 'A-',
    3: 'B+',
    4: 'B',
    5: 'B-',
    6: 'C',
};

export const gradeColorMapping: { [key: string]: string } = {
    'A+': '#95e1d3',
    'A': '#eaffd0',
    'A-':'#eaffd0',
    'B+': '#fce38a',
    'B': '#fce38a',
    'B-': '#fce38a',
    'C': '#f38181',
};

export const gradeReverseMapping: { [key: string]: number } = {
    'A+': 0,
    'A': 1,
    'A-': 2,
    'B+': 3,
    'B': 4,
    'B-': 5,
    'C': 6,
};
