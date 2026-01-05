import colors from '../utils/colors';

const IrviLogo = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: { width: '80px', fontSize: '14px', subSize: '10px' },
    md: { width: '120px', fontSize: '20px', subSize: '12px' },
    lg: { width: '160px', fontSize: '28px', subSize: '16px' },
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        style={{
          backgroundColor: colors.primary.teal,
          width: sizeConfig.width,
          aspectRatio: '1',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 188, 212, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', color: colors.primary.white }}>
          <div style={{
            fontSize: sizeConfig.fontSize,
            fontWeight: 'bold',
            letterSpacing: '2px',
            lineHeight: '1',
          }}>
            IRVI
          </div>
          <div style={{
            fontSize: sizeConfig.subSize,
            letterSpacing: '1px',
            marginTop: '4px',
            opacity: 0.9,
          }}>
            TOURS
          </div>
        </div>
      </div>
    </div>
  );
};

export default IrviLogo;
