import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import {
  Stack,
  Flex,
  Text,
  Button,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  Image,
  Select,
} from "@chakra-ui/react";

const App = () => {
  const webcamRef = useRef(null);
  const [filtersApplied, setFiltersApplied] = useState([]);
  const [intensities, setIntensities] = useState({});
  const [optionsState, setOptionsState] = useState({
    "Conversão de Cor": "RGB",
    Filtro: "Blur",
    "Detector de Borda": "Laplacian",
    Binarização: "Otsu",
    "Morfologia Matemática": "Erosion",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);

  const filterCommands = {
    RGB: "COLOR_RGB2RGB",
    Grayscale: "COLOR_RGB2GRAY",
    HSV: "COLOR_RGB2HSV",
    YUV: "COLOR_RGB2YUV",
    LAB: "COLOR_RGB2LAB",
    Blur: "BLUR",
    Canny: "CANNY",
    Sobel: "SOBEL",
    Laplacian: "LAPLACIAN",
    Prewitt: "PREWITT",
    Roberts: "ROBERTS",
    Otsu: "OTSU",
    AdaptiveThresholding: "ADAPTIVE_THRESHOLD",
    SimpleThresholding: "THRESHOLD",
    Erosion: "EROSION",
    Dilation: "MORPH_DILATE",
    Opening: "OPENING",
    Closing: "CLOSING",
  };

  const applyFilterWithIntensity = (method) => {
    const intensity = Math.min(intensities[method] || 0, 100);
    const command = filterCommands[optionsState[method]];

    let filterCommand;
    let additionalParameters = {};

    const selectedMethod = imageProcessingMethods.find(
      (item) => item.name === method
    );

    if (selectedMethod) {
      selectedMethod.options.forEach((option) => {
        if (option.nome === optionsState[method] && option.input.length > 0) {
          option.input.forEach((param) => {
            if (param.type !== "dropdown") {
              additionalParameters[param.name] =
                intensities[param.name] !== undefined
                  ? Math.min(
                      Math.max(intensities[param.name], param.min),
                      param.max
                    )
                  : 2;

              console.log(param.max);
            }
          });
        }
      });
    }

    filterCommand = `${optionsState[method]} - ${method}`;

    if (
      (method === "Detector de Borda" && optionsState[method] === "Sobel") ||
      (method === "Detector de Borda" && optionsState[method] === "Laplacian")
    ) {
      const selectedSobelOption = intensities["ddepth"];
      if (selectedSobelOption !== undefined) {
        additionalParameters["ddepth"] = selectedSobelOption;
      } else {
        additionalParameters["ddepth"] = "cv2.CV_8U";
      }
    }

    if (
      method === "Binarização" &&
      optionsState[method] === "AdaptiveThresholding"
    ) {
      const selectedSobelOption = intensities["AdaptiveType"];
      if (selectedSobelOption !== undefined) {
        additionalParameters["AdaptiveType"] = selectedSobelOption;
      } else {
        additionalParameters["AdaptiveType"] = "cv2.ADAPTIVE_THRESH_MEAN_C";
      }
    }

    setFiltersApplied((prevFilters) => [
      ...prevFilters,
      {
        id: Date.now(),
        command,
        text: filterCommand,
        intensity,
        additionalParameters: additionalParameters,
      },
    ]);
    setIntensities((prevIntensities) => ({ ...prevIntensities, [method]: 0 }));
  };

  const removeFilter = (id) => {
    setFiltersApplied((prevFilters) =>
      prevFilters.filter((filter) => filter.id !== id)
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const sendDataToAPI = async () => {
    const base64Image = await convertImageToBase64(selectedImage);
    const filtersData = {
      image: base64Image,
      filters: filtersApplied.map(
        ({ command, intensity, additionalParameters }) => ({
          command,
          intensity,
          additionalParameters,
        })
      ),
    };

    try {
      console.log("Enviando dados para a API:", filtersData);

      const response = await axios.post(
        "http://localhost:5000/process_image",
        filtersData
      );
      console.log("Resposta da API:", response.data);
      setProcessedImage(response.data.processed_image);
    } catch (error) {
      console.error("Erro ao enviar dados para a API:", error);
    }
  };

  const imageProcessingMethods = [
    {
      name: "Conversão de Cor",
      options: [
        { nome: "RGB", input: [] },
        { nome: "Grayscale", input: [] },
        { nome: "HSV", input: [] },
        { nome: "YUV", input: [] },
        { nome: "LAB", input: [] },
      ],
    },
    {
      name: "Filtro",
      options: [
        { nome: "Blur", input: [{ name: "Kernel", max: 255, min: 0 }] },
        {
          nome: "Canny",
          input: [
            { name: "Threshold 1", max: 255, min: 0 },
            { name: "Threshold 2", max: 255, min: 0 },
          ],
        },
      ],
    },
    {
      name: "Detector de Borda",
      options: [
        {
          nome: "Sobel",
          input: [
            {
              type: "dropdown",
              values: [
                "cv2.CV_8U",
                "cv2.CV_16U",
                "cv2.CV_16S",
                "cv2.CV_32F",
                "cv2.CV_64F",
              ],
            },
          ],
        },
        {
          nome: "Laplacian",
          input: [
            {
              type: "dropdown",
              values: [
                "cv2.CV_8U",
                "cv2.CV_16U",
                "cv2.CV_16S",
                "cv2.CV_32F",
                "cv2.CV_64F",
              ],
            },
          ],
        },
        {
          nome: "Prewitt",
          input: [
            { name: "x", max: 100, min: 0 },
            { name: "y", max: 100, min: 0 },
          ],
        },
        {
          nome: "Roberts",
          input: [
            { name: "x", max: 100, min: 0 },
            { name: "y", max: 100, min: 0 },
          ],
        },
      ],
    },
    {
      name: "Binarização",
      options: [
        {
          nome: "Otsu",
          input: [
            { name: "Min", max: 255, min: 0 },
            { name: "Max", max: 255, min: 0 },
          ],
        },
        {
          nome: "AdaptiveThresholding",
          input: [
            { name: "Max", max: 255, min: 0 },
            {
              name: "AdaptiveType",
              type: "dropdown",
              values: [
                "cv2.ADAPTIVE_THRESH_MEAN_C",
                "cv2.ADAPTIVE_THRESH_GAUSSIAN_C",
              ],
            },
          ],
        },
        {
          nome: "SimpleThresholding",
          input: [
            { name: "Min", max: 255, min: 0 },
            { name: "Max", max: 255, min: 0 },
          ],
        },
      ],
    },
    {
      name: "Morfologia Matemática",
      options: [
        { nome: "Erosion", input: [{ name: "px", max: 100, min: 0 }] },
        { nome: "Dilation", input: [{ name: "px", max: 100, min: 0 }] },
        { nome: "Opening", input: [{ name: "px", max: 100, min: 0 }] },
        { nome: "Closing", input: [{ name: "px", max: 100, min: 0 }] },
      ],
    },
  ];

  return (
    <Stack w={"100vw"} h="100vh" bg="#f5f5f5" p={6} gap={6}>
      <input
        type="file"
        onChange={handleImageChange}
        // style={{ backgroundColor: "aqua" }}
      />
      <Flex direction={"row"} justify="center" h={"50%"} w={"100%"}>
        <Flex w={"50%"} h="100%" justify={"center"}>
          {selectedImage ? (
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Selected"
              style={{ height: "100%" }}
            />
          ) : (
            <Flex
              w={"50%"}
              h="100%"
              bg={"ButtonFace"}
              justify={"center"}
              align={"center"}
            >
              <Text>Imagen...</Text>
            </Flex>
          )}
        </Flex>
        <Flex w={"50%"} h="100%" justify={"center"}>
          {processedImage ? (
            <Image
              src={`data:image/jpeg;base64,${processedImage}`}
              alt="Processed"
              style={{ height: "100%" }}
            />
          ) : (
            <Flex
              w={"50%"}
              h="100%"
              bg={"ButtonFace"}
              justify={"center"}
              align={"center"}
            >
              <Text>Processed Imagen...</Text>
            </Flex>
          )}
        </Flex>
      </Flex>
      <Flex
        w={"100%"}
        direction={"column"}
        justify={"space-between"}
        gap="6"
        align={"center"}
      >
        <Flex w="100%" h={"50%"} direction={"row"}>
          <Flex direction={"column"} w="50%" justify="space-between">
            <VStack spacing={4}>
              <Text>Métodos de Processamento de Imagem</Text>
              {imageProcessingMethods.map(({ name, options }) => (
                <Flex
                  key={name}
                  w={"80%"}
                  direction={"row"}
                  align="center"
                  justify="space-between"
                  gap="6"
                >
                  <Menu>
                    <MenuButton bg="ButtonShadow" w="300px" as={Button}>
                      {optionsState[name]}
                    </MenuButton>
                    <MenuList>
                      {options.map((option) => (
                        <MenuItem
                          key={option.nome}
                          onClick={() => {
                            setOptionsState({
                              ...optionsState,
                              [name]: option.nome,
                            });
                            if (option.input.length > 0) {
                              setIntensities({
                                ...intensities,
                                [option.nome]: 0,
                              });
                            }
                          }}
                        >
                          {option.nome}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                  {optionsState[name] &&
                    options
                      .find((o) => o.nome === optionsState[name])
                      .input.map((input, index) => (
                        <React.Fragment key={index}>
                          {input.type === "dropdown" ? (
                            <Select
                              value={intensities[input.name] || ""}
                              onChange={(e) =>
                                setIntensities({
                                  ...intensities,
                                  [input.name]: e.target.value,
                                })
                              }
                              w="auto"
                            >
                              {input.values.map((value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <Input
                              type="number"
                              max={input.max}
                              min={input.min}
                              value={intensities[input.name] || ""}
                              onChange={(e) =>
                                setIntensities({
                                  ...intensities,
                                  [input.name]: e.target.value,
                                })
                              }
                              placeholder={`Insira ${input.name}`}
                              w="auto"
                            />
                          )}
                        </React.Fragment>
                      ))}

                  <Button onClick={() => applyFilterWithIntensity(name)}>
                    Aplicar
                  </Button>
                </Flex>
              ))}
            </VStack>
          </Flex>

          <Flex
            direction={"column"}
            w="100%"
            textAlign={"center"}
            gap={"6"}
            overflow={"scroll"}
          >
            <Text>Filtros Aplicados</Text>
            <VStack spacing={4} justify={"space-between"}>
              {filtersApplied.map((filter) => (
                <Flex
                  key={filter.id}
                  justify="space-between"
                  align="center"
                  w="100%"
                >
                  <Text>{filter.text}</Text>
                  {filter.additionalParameters && (
                    <Flex gap={6}>
                      {Object.entries(filter.additionalParameters).map(
                        ([key, value]) =>
                          value !== undefined && (
                            <Text key={key}>{`${key}: ${
                              key === "ddepth" &&
                              filter.command.includes("Sobel")
                                ? value || "cv2.CV_8U"
                                : value || ""
                            }`}</Text>
                          )
                      )}
                    </Flex>
                  )}
                  <Button size="sm" onClick={() => removeFilter(filter.id)}>
                    Remover
                  </Button>
                </Flex>
              ))}
            </VStack>
          </Flex>
        </Flex>
        <Button w="80%" onClick={sendDataToAPI}>
          Enviar para API
        </Button>
      </Flex>
    </Stack>
  );
};

export default App;
