import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { cn } from '@/lib/utils';

interface WebCameraProps {
  onCapture: (photoUri: string) => void;
  onCancel: () => void;
  className?: string;
}

export function WebCamera({ onCapture, onCancel, className }: WebCameraProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10MB.');
      return;
    }

    // Criar URL de preview
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUri(dataUrl);
    };
    
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (previewUri) {
      onCapture(previewUri);
    }
  };

  const handleRetake = () => {
    setPreviewUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View className={cn('flex-1 bg-black', className)}>
      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef as any}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange as any}
        style={{ display: 'none' }}
      />

      {previewUri ? (
        // Preview da foto
        <View className="flex-1 relative">
          <Image
            source={{ uri: previewUri }}
            className="flex-1"
            resizeMode="contain"
          />
          
          {/* Botões de ação */}
          <View className="absolute bottom-0 left-0 right-0 p-6 flex-row justify-around">
            <TouchableOpacity
              onPress={handleRetake}
              className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-full"
            >
              <Text className="text-white font-semibold text-lg">
                Tirar Novamente
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleConfirm}
              className="bg-primary px-8 py-4 rounded-full"
            >
              <Text className="text-white font-semibold text-lg">
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Tela de captura
        <View className="flex-1 items-center justify-center">
          <View className="items-center gap-6">
            <View className="w-32 h-32 bg-white/10 rounded-full items-center justify-center">
              <Text className="text-6xl">📷</Text>
            </View>
            
            <Text className="text-white text-xl font-semibold text-center">
              Tirar Foto
            </Text>
            
            <Text className="text-white/70 text-base text-center px-8">
              Clique no botão abaixo para abrir a câmera ou selecionar uma foto da galeria
            </Text>
            
            <TouchableOpacity
              onPress={triggerFileInput}
              className="bg-primary px-12 py-4 rounded-full mt-4"
            >
              <Text className="text-white font-semibold text-lg">
                Abrir Câmera
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onCancel}
              className="bg-white/20 backdrop-blur-sm px-12 py-4 rounded-full"
            >
              <Text className="text-white font-semibold text-lg">
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
