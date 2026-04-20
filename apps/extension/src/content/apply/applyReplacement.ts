export const applyReplacement = (text: string, offset: number, length: number, replacement: string) => {
  const nextText = `${text.slice(0, offset)}${replacement}${text.slice(offset + length)}`;

  return {
    text: nextText,
    caretOffset: offset + replacement.length
  };
};
