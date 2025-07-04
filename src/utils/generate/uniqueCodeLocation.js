import { listMappingLocation } from './listMappingLocation.js';

export const uniqueCodeLocation = async (name, prisma) => {
  const key = name.trim().toLowerCase();
  const base = listMappingLocation[key] || name.slice(0, 3).toLowerCase();

  const existing = await prisma.location.findMany({
    where: {
      code: {
        startsWith: base,
      },
    },
    select: {
      code: true,
    },
  });

  const usedNumbers = existing
    .map(loc => parseInt(loc.code.split('-')[1]))
    .filter(n => !isNaN(n));

  const nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;

  return `${base}-${nextNumber}`;
};
