import React from 'react';

interface BrainIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const BrainIcon: React.FC<BrainIconProps> = ({
  className = '',
  size = 28,
  color = '#A88768',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Nét vẽ não bộ mềm mại, phong cách neuroscience & cute */}
      {/* Bán cầu trái */}
      <path
        d="M16 6C13.5 6 11.5 7.5 11 9.5C9.5 9.8 8 11.5 8 13.5C8 14.5 8.5 15.5 9 16C8 17 7.5 18.5 8 20C8.5 21.8 10.2 23 12 23C13 23 14 22.5 14.5 21.8C15 22.8 15.5 23.5 16 23.8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bán cầu phải */}
      <path
        d="M16 6C18.5 6 20.5 7.5 21 9.5C22.5 9.8 24 11.5 24 13.5C24 14.5 23.5 15.5 23 16C24 17 24.5 18.5 24 20C23.5 21.8 21.8 23 20 23C19 23 18 22.5 17.5 21.8C17 22.8 16.5 23.5 16 23.8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Các rãnh não uốn lượn mềm mại bên trong */}
      <path
        d="M13 11C13.5 12 14.5 12.5 15.5 12.5"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M19 11C18.5 12 17.5 12.5 16.5 12.5"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M11.5 17C12.5 17 13.5 17.8 14 19"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M20.5 17C19.5 17 18.5 17.8 18 19"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Điểm nối neuron nhỏ xinh */}
      <circle cx="16" cy="16" r="1.5" fill={color} />
      <circle cx="16" cy="7.5" r="1" fill={color} />
      <circle cx="16" cy="22" r="1" fill={color} />
    </svg>
  );
};

export const NeuronSparkleIcon: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 18,
  color = '#C7D2BE',
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2V6M12 18V22M2 12H6M18 12H22M5 5L8 8M16 16L19 19M19 5L16 8M8 16L5 19"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.5" fill={color} />
    </svg>
  );
};

export const LeafBranchIcon: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 18,
  color = '#F7F2E8',
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Nhánh lá non cách điệu nét mảnh, thanh lịch */}
      <path
        d="M3 21C6 19.5 9 16 11 10.5C12.5 6.5 16 3.5 20.5 3C20 7.5 17 11 13 12.5C7.5 14.5 4 17.5 3 21Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 12C7.5 11 5.5 8.5 5.5 6C8 6 10.5 8 11.5 10.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11.5C16.5 13 18.5 15.5 18.5 18C16 18 13.5 16 12.5 13.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20.5" cy="3" r="1.2" fill={color} />
    </svg>
  );
};
