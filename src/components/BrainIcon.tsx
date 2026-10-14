import React from 'react';

export interface BrainIconProps {
  className?: string;
  size?: number;
  color?: string;
  leafColor?: string;
  subLeafColor?: string;
}

export const BrainIcon: React.FC<BrainIconProps> = ({
  className = '',
  size = 28,
  color = '#526B48',
  leafColor = '#A9BE91',
  subLeafColor = '#DDEBCB',
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
      {/* Biểu tượng thương hiệu Hiểu Mình: Bộ não tối giản kết hợp chiếc lá nhỏ */}
      {/* Bán cầu não trái */}
      <path
        d="M16 11C13.2 11 10.8 12.3 9.4 14.5C7.8 16.8 7 19.5 7.2 22.2C7.4 24.8 8.8 26.9 10.8 28C12.3 28.8 14.2 28.9 16 28.4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bán cầu não phải */}
      <path
        d="M16 11C18.8 11 21.2 12.3 22.6 14.5C24.2 16.8 25 19.5 24.8 22.2C24.6 24.8 23.2 26.9 21.2 28C19.7 28.8 17.8 28.9 16 28.4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rãnh não uốn lượn mềm mại bên trái */}
      <path
        d="M10.8 16.8C12.2 16.8 13.5 17.8 14.5 19.2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8.8 22.5C10.2 22.5 12 23.8 13 25.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Rãnh não uốn lượn mềm mại bên phải */}
      <path
        d="M21.2 16.8C19.8 16.8 18.5 17.8 17.5 19.2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M23.2 22.5C21.8 22.5 20 23.8 19 25.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Trục liên kết nơ-ron trung tâm */}
      <path
        d="M16 13V26.5"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="1 2.5"
      />
      {/* Cuống lá vươn lên từ tâm não */}
      <path
        d="M16 11.5C16 7.8 18.2 5 21 3.8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Mầm lá phụ nhỏ bên trái */}
      <path
        d="M16.5 8C14.2 7 12.5 8.2 12 9.8C13.8 10.2 15.8 9.4 16.5 8Z"
        fill={subLeafColor}
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Chiếc lá chính vươn lên góc trên phải */}
      <path
        d="M21 3.8C21 1.2 24.2 0.8 26.8 1.8C26.8 4.8 24.2 6.2 21 3.8Z"
        fill={leafColor}
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M21 3.8L26.2 1.8"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Điểm nơ-ron kết nối */}
      <circle cx="16" cy="11.5" r="1.2" fill={color} />
    </svg>
  );
};

export const BrainLogo = BrainIcon;

export const NeuronSparkleIcon: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 18,
  color = '#A9BE91',
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
  color = '#FFFFFF',
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
