
export const getRatingColor = (rating) => {
  if (!rating) return '#4B5563';
  const roundedRating = Math.round(rating);
  const colors = [
    '#fc3a3a', '#f56c45', '#ffa457', '#ffcb52', '#faed52',
    '#e1ff47', '#b1fa6b', '#6ad46a', '#3ecf3e', '#28bf28',
  ];
  return colors[Math.min(9, Math.max(0, roundedRating - 1))];
};

export const getDecimalColor = (rating) => {
  if (!rating) return '#9CA3AF';
  return getRatingColor(Math.floor(rating));
};