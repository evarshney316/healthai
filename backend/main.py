from pathlib import Path
from typing import Dict, Any

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = (
    BASE_DIR
    / "datasets"
    / "diabetes"
    / "diabetes.csv"
)


# ============================================================
# MODEL CONFIGURATION
# ============================================================

FEATURES = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]

TARGET = "Outcome"


FEATURE_LABELS = {
    "Pregnancies": "Pregnancies",
    "Glucose": "Glucose",
    "BloodPressure": "Blood pressure",
    "SkinThickness": "Skin thickness",
    "Insulin": "Insulin",
    "BMI": "BMI",
    "DiabetesPedigreeFunction": "Family-history signal",
    "Age": "Age",
}


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="HealthAI Intelligence API",
    version="2.0.0",
    description="Educational AI health-risk assessment API.",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# GLOBAL MODEL STATE
# ============================================================

model = None
model_error = None
dataset_rows = 0
model_accuracy = None
feature_weights: Dict[str, float] = {}


# ============================================================
# TRAIN MODEL
# ============================================================

def train_model():

    global model
    global model_error
    global dataset_rows
    global model_accuracy
    global feature_weights

    try:

        if not DATASET_PATH.exists():

            raise FileNotFoundError(
                f"Dataset not found at: {DATASET_PATH}"
            )

        df = pd.read_csv(DATASET_PATH)

        required_columns = FEATURES + [TARGET]

        missing_columns = [
            column
            for column in required_columns
            if column not in df.columns
        ]

        if missing_columns:

            raise ValueError(
                f"Missing dataset columns: {missing_columns}"
            )

        dataset_rows = len(df)

        X = df[FEATURES].copy()

        y = df[TARGET]

        # In this dataset, zero can represent missing
        # measurements for some health-related fields.

        zero_as_missing = [
            "Glucose",
            "BloodPressure",
            "SkinThickness",
            "Insulin",
            "BMI",
        ]

        for column in zero_as_missing:

            X[column] = X[column].replace(
                0,
                np.nan
            )

        # Machine learning pipeline

        model = Pipeline(
            [

                (
                    "imputer",
                    SimpleImputer(
                        strategy="median"
                    ),
                ),

                (
                    "scaler",
                    StandardScaler(),
                ),

                (
                    "classifier",
                    LogisticRegression(
                        max_iter=2000
                    ),
                ),

            ]
        )

        model.fit(X, y)

        # Training-set accuracy
        # This is NOT a test-set evaluation.

        model_accuracy = float(
            model.score(X, y)
        )

        classifier = model.named_steps[
            "classifier"
        ]

        coefficients = classifier.coef_[0]

        feature_weights = {
            name: float(weight)
            for name, weight
            in zip(FEATURES, coefficients)
        }

        model_error = None

    except Exception as error:

        model = None

        model_error = str(error)


# Train when backend starts
train_model()


# ============================================================
# INPUT SCHEMA
# ============================================================

class HealthInput(BaseModel):

    pregnancies: int = Field(
        ge=0,
        le=20
    )

    glucose: float = Field(
        gt=0,
        le=300
    )

    blood_pressure: float = Field(
        gt=0,
        le=200
    )

    skin_thickness: float = Field(
        ge=0,
        le=150
    )

    insulin: float = Field(
        ge=0,
        le=900
    )

    bmi: float = Field(
        gt=0,
        le=80
    )

    diabetes_pedigree_function: float = Field(
        ge=0,
        le=3
    )

    age: int = Field(
        ge=1,
        le=120
    )


# ============================================================
# EXPLAINABILITY
# ============================================================

def build_explanation(
    payload: HealthInput
) -> list[dict[str, Any]]:

    values = {

        "Pregnancies":
            payload.pregnancies,

        "Glucose":
            payload.glucose,

        "BloodPressure":
            payload.blood_pressure,

        "SkinThickness":
            payload.skin_thickness,

        "Insulin":
            payload.insulin,

        "BMI":
            payload.bmi,

        "DiabetesPedigreeFunction":
            payload.diabetes_pedigree_function,

        "Age":
            payload.age,
    }

    ranked_features = sorted(
        feature_weights.items(),
        key=lambda item: abs(item[1]),
        reverse=True,
    )

    explanation = []

    for name, weight in ranked_features[:5]:

        explanation.append(
            {
                "feature":
                    FEATURE_LABELS[name],

                "value":
                    values[name],

                "direction":
                    (
                        "increases model score"
                        if weight > 0
                        else
                        "decreases model score"
                    ),

                "weight":
                    round(weight, 3),
            }
        )

    return explanation


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():

    return {

        "status":
            "ok",

        "model_loaded":
            model is not None,

        "model_error":
            model_error,

        "model":
            "Logistic Regression",

        "dataset_rows":
            dataset_rows,

        "training_accuracy":
            (
                round(
                    model_accuracy * 100,
                    2
                )
                if model_accuracy
                else None
            ),
    }


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.get("/api/model")
def model_info():

    return {

        "name":
            "HealthAI Risk Engine",

        "version":
            "2.0.0",

        "algorithm":
            "Logistic Regression",

        "dataset_rows":
            dataset_rows,

        "training_accuracy":
            (
                round(
                    model_accuracy * 100,
                    2
                )
                if model_accuracy
                else None
            ),

        "features":
            [
                FEATURE_LABELS[feature]
                for feature in FEATURES
            ],

        "status":
            (
                "online"
                if model is not None
                else "offline"
            ),
    }


# ============================================================
# PREDICTION API
# ============================================================

@app.post("/api/predict")
def predict(data: HealthInput):

    if model is None:

        raise HTTPException(
            status_code=500,
            detail=f"Model unavailable: {model_error}",
        )

    input_data = pd.DataFrame(
        [[
            data.pregnancies,
            data.glucose,
            data.blood_pressure,
            data.skin_thickness,
            data.insulin,
            data.bmi,
            data.diabetes_pedigree_function,
            data.age,
        ]],
        columns=FEATURES,
    )

    probability = float(
        model.predict_proba(
            input_data
        )[0][1]
    )

    prediction = int(
        model.predict(
            input_data
        )[0]
    )

    percentage = round(
        probability * 100,
        2
    )

    # Product-level category.
    # This is NOT a medical diagnosis.

    if percentage < 30:

        category = (
            "Lower model-estimated risk"
        )

        tone = "low"

    elif percentage < 60:

        category = (
            "Moderate model-estimated risk"
        )

        tone = "moderate"

    else:

        category = (
            "Higher model-estimated risk"
        )

        tone = "high"

    return {

        "predicted_class":
            prediction,

        "probability":
            percentage,

        "category":
            category,

        "tone":
            tone,

        "explanation":
            build_explanation(data),

        "model":
            "Logistic Regression",

        "model_version":
            "2.0.0",

        "notice":
            (
                "Educational model output only. "
                "This is not a medical diagnosis "
                "or treatment recommendation. "
                "Model estimates can be wrong."
            ),
    }