import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
} from 'react';
import { Link, useHistory } from 'react-router-dom';
import { LeafletMouseEvent } from 'leaflet';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';

import api from '../../services/api';

import Dropzone from '../../components/Dropzone';

import './styles.css';
import logo from '../../assets/logo.svg';

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEResponse {
  id: number;
  sigla: string;
  nome: string;
}

interface Location {
  id: number;
  name: string;
}

interface InputData {
  name: string;
  email: string;
  whatsapp: string;
}

const CreatePoint: React.FC = () => {
  const history = useHistory();

  const [selectedFile, setSelectedFile] = useState<File>();
  const [itemList, setItemList] = useState<Item[]>([]);
  const [ufs, setUFs] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [selectedUF, setSelectedUF] = useState('0');
  const [selectedCity, setSelectedCity] = useState('0');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([
    0,
    0,
  ]);
  const [inputData, setInputData] = useState<InputData>({
    name: '',
    email: '',
    whatsapp: '',
  });

  useEffect(() => {
    api.get('items').then((response) => {
      setItemList(response.data);
    });
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      setMapCenter([latitude, longitude]);
    });
  }, []);

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
            name: uf.sigla,
          };
        });

        setUFs(ufList);
      });
  }, []);

  useEffect(() => {
    if (selectedUF === '0') {
      return;
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
            name: city.nome,
          };
        });

        setCities(cityList);
      });
  }, [selectedUF]);

  const handleSelectUF = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const uf = event.target.value;

      setSelectedUF(uf);
    },
    [],
  );

  const handleSelectCity = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const city = event.target.value;

      setSelectedCity(city);
    },
    [],
  );

  const handleMarkChange = useCallback((event: LeafletMouseEvent) => {
    setMarkerPosition([event.latlng.lat, event.latlng.lng]);
  }, []);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;

      setInputData((oldState) => {
        return {
          ...oldState,
          [name]: value,
        };
      });
    },
    [],
  );

  const handleSelectItem = useCallback(
    (id: number) => {
      const isSelected = selectedItems.findIndex((item) => item === id);

      if (isSelected >= 0) {
        const filteredItems = selectedItems.filter((item) => item !== id);
        setSelectedItems(filteredItems);
      } else {
        setSelectedItems((oldState) => {
          return [...oldState, id];
        });
      }
    },
    [selectedItems],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      const { name, email, whatsapp } = inputData;
      const uf = selectedUF;
      const city = selectedCity;
      const [latitude, longitude] = markerPosition;
      const items = selectedItems;
      
      const data = new FormData();
      
      data.append('name', name);
      data.append('email', email);
      data.append('whatsapp', whatsapp);
      data.append('latitude', String(latitude));
      data.append('longitude', String(longitude));
      data.append('uf', uf);
      data.append('city', city);
      data.append('items', items.join(','));

      
      if (selectedFile) {
        data.append('image', selectedFile);        
      };

      await api.post('points', data);

      alert('Ponto de coleta criado!');

      history.push('/');
    },
    [
      inputData,
      selectedUF,
      selectedCity,
      selectedItems,
      markerPosition,
      selectedFile,
      history,
    ],
  );

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />

        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro do <br /> ponto de coleta
        </h1>
        
        <Dropzone onFileUploaded={setSelectedFile} />
        
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">
              Nome da entidade
              <input
                type="text"
                name="name"
                id="name"
                onChange={handleInputChange}
              />
            </label>
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">
                Email
                <input
                  type="email"
                  name="email"
                  id="email"
                  onChange={handleInputChange}
                />
              </label>
            </div>
            <div className="field">
              <label htmlFor="whatsapp">
                Whatsapp
                <input
                  type="text"
                  name="whatsapp"
                  id="whatsapp"
                  onChange={handleInputChange}
                />
              </label>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={mapCenter} zoom={15} onClick={handleMarkChange}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={markerPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">
                UF
                <select
                  name="uf"
                  id="uf"
                  value={selectedUF}
                  onChange={handleSelectUF}
                >
                  <option value="0">Selecione o estado</option>
                  {ufs.map((uf) => (
                    <option key={uf.id} value={uf.name}>
                      {uf.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="field">
              <label htmlFor="city">
                Cidade
                <select
                  name="city"
                  id="city"
                  value={selectedCity}
                  onChange={handleSelectCity}
                >
                  <option value="0">Selecione uma cidade</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <h2>Items de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {itemList.map((item) => (
              <li
                key={item.id}
                className={selectedItems.includes(item.id) ? 'selected' : ''}
                onClick={() => handleSelectItem(item.id)}
              >
                <img src={item.image_url} alt={item.title} />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>
        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
};

export default CreatePoint;
