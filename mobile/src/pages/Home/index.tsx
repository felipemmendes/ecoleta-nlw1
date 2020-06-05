import React, { useState, useEffect } from 'react';
import { View, ImageBackground, Text, Image, TextInput } from 'react-native';
import Select from 'react-native-picker-select';
import { useNavigation } from '@react-navigation/native';
import { RectButton } from 'react-native-gesture-handler';
import { Feather as Icon } from '@expo/vector-icons';
import axios from 'axios';

import styles from './styles';

import logo from '../../assets/logo.png';
import home from '../../assets/home-background.png';

interface IBGEResponse {
  id: number;
  sigla: string;
  nome: string;
}

interface Location {
  id: number;
  label: string;
  value: string;
}

const Home: React.FC = () => {
  const navigation = useNavigation();

  const [ufs, setUFs] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [selectedUF, setSelectedUF] = useState('0');
  const [selectedCity, setSelectedCity] = useState('0');

  useEffect(() => {
    axios
      .get<IBGEResponse[]>(
        'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
        {
          params: {
            orderBy: 'nome',
          },
        },
      )
      .then((response) => {
        const ufList = response.data.map((uf) => {
          return {
            id: uf.id,
            label: uf.sigla,
            value: uf.sigla,
          };
        });

        setUFs(ufList);
      });
  }, []);

  useEffect(() => {
    if (selectedUF === '0') {
      setSelectedCity('0');
    }

    axios
      .get<IBGEResponse[]>(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`,
        {
          params: {
            orderBy: 'nome',
          },
        },
      )
      .then((response) => {
        const cityList = response.data.map((city) => {
          return {
            id: city.id,
            label: city.nome,
            value: city.nome,
          };
        });

        setCities(cityList);
      });
  }, [selectedUF]);

  const handleSelectUF = (value: string): void => {
    setSelectedUF(value);
  };

  const handleSelectCity = (value: string): void => {
    setSelectedCity(value);
  };

  const handleNavigateToPoints = (): void => {
    navigation.navigate('Points', {
      uf: selectedUF,
      city: selectedCity,
    });
  };

  return (
    <ImageBackground
      source={home}
      style={styles.container}
      imageStyle={{ width: 274, height: 368 }}
    >
      <View style={styles.main}>
        <Image source={logo} />
        <Text style={styles.title}>Seu marketplace de coleta de resíduos</Text>
        <Text style={styles.description}>
          Ajudamos pessoas a encontrarem pontos de coleta de forma eficiente.
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.input}>
          <Select
            placeholder={{ label: 'Selecione o estado', value: '0' }}
            items={ufs}
            onValueChange={(value) => handleSelectUF(value)}
          />
        </View>
        <View style={styles.input}>
          <Select
            placeholder={{ label: 'Selecione a cidade', value: '0' }}
            items={cities}
            onValueChange={(value) => handleSelectCity(value)}
            disabled={selectedUF === '0'}
          />
        </View>
        <RectButton
          style={[styles.button, selectedCity === '0' && styles.buttonDisabled]}
          onPress={handleNavigateToPoints}
          enabled={selectedCity !== '0'}
        >
          <View style={styles.buttonIcon}>
            <Text>
              <Icon name="arrow-right" color="#FFF" size={24} />
            </Text>
          </View>
          <Text style={styles.buttonText}>Entrar</Text>
        </RectButton>
      </View>
    </ImageBackground>
  );
};

export default Home;
