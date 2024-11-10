import { marshall } from "@aws-sdk/util-dynamodb";
import { Patient } from "./types";

export const generatePatientItem = (patient: Patient) => {
  return {
    PutRequest: {
      Item: marshall(patient),
    },
  };
};

export const generateBatch = (data: Patient[]) => {
  return data.map((e) => {
    return generatePatientItem(e);
  });
};
