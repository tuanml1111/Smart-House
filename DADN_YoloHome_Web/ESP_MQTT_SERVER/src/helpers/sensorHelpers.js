function convertPayloadStrToObj(payloadStr) {
    const values = payloadStr.split(',');
    return {
      temperature: parseFloat(values[0]),
      pressure: parseFloat(values[1]),
      airQuality: parseFloat(values[2]),
      lightIntensity: parseFloat(values[3])
    };
  }
  
  module.exports = { convertPayloadStrToObj };
  