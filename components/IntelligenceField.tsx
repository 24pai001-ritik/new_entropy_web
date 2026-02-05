import React from 'react';

const IntelligenceField: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Ambient gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#080A0F] via-[#0A0D15] to-[#080A0F]" />


            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(79, 209, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79, 209, 255, 0.1) 1px, transparent 1px)
          `,
                    backgroundSize: '100px 100px'
                }}
            />
        </div>
    );
};

export default IntelligenceField;
