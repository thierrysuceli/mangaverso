import { useState, useEffect } from 'react';

const AVATAR_OPTIONS = [
  '08b31a014301262d4cfb4790cc77b803cfc6cfad008aec6a0b3b69400274abdb.jpg',
  '6037fb4148e363e470a13143f2e011f66645bc1e05d40efc1695d3f2b76892a0.jpg',
  '77b1306c98fa49eac5a5d78a073ef635260cde5a5dfdb0b109b2956066cb685b.jpg',
  '84303594b275811ad713fa918072f93ba753048d7a5e0996f60d8761da21301d.jpg',
  'a03ab7976853d41f5af02c82c45652f16826cda1e49a1c2b4a966d68ffa17a00.jpg',
  'a61800aac268c81072077ee3624d974853c71a50a04471be180f10399e6f2b15.jpg',
  'acc1dcc7888395f75576d5eec954db7caf957d8946c5d07e754e4769cff39dd2.jpg',
  'c3421a4d36088a6009fe456b0e24a607e31fcd4e8c28893ced3e8117fea06e50.jpg',
  'e65bff739d0298ee0a071424a7c4d3e202dcecfbb8311f821f2dc61eb598f261.jpg',
  'IxX1CkAoGrHZkdCXDCfZlfLgn8HDjhcM.jpg',
  'NfcvAbwnPdIeskJG4sFFMV7uzeGQ8AeD.jpg',
  'ZT3wqHeizU5ieu9o8mMlv3rCxM6NGgw7.jpg',
];

const AvatarSelector = ({ currentAvatar, onSelect, onClose }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const handleSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };

  const handleConfirm = () => {
    onSelect(selectedAvatar);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold">Escolha seu Avatar</h2>
          <p className="text-sm text-text-secondary mt-1">
            Selecione um avatar para seu perfil
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {AVATAR_OPTIONS.map((avatar) => {
              const avatarPath = `/avatars/${avatar}`;
              const isSelected = selectedAvatar === avatarPath;
              
              return (
                <button
                  key={avatar}
                  onClick={() => handleSelect(avatarPath)}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                    isSelected
                      ? 'ring-4 ring-accent scale-105'
                      : 'ring-2 ring-gray-700 hover:ring-accent/50 hover:scale-102'
                  }`}
                >
                  <img
                    src={avatarPath}
                    alt="Avatar option"
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg font-medium transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;
