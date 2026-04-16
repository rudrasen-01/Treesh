// Demo configuration for API delays and other demo settings

export const getDefaultApiDelay = (): number => {
  return 500; // Default 500ms delay
};

export const getRandomApiDelay = (): number => {
  return Math.random() * 1000 + 200; // Random delay between 200-1200ms
};

export const demoConfig = {
  apiDelay: {
    default: 500,
    min: 200,
    max: 1200
  },
  enableRandomErrors: false,
  enableSlowResponses: false
};
