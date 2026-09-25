import React from "react";
import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  CircleHelp,
  Clock3,
  Gauge,
  HeartPulse,
  History,
  Info,
  LayoutDashboard,
  Menu,
  Moon,
  Network,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  X,
  Zap,
} from "lucide-react";


const API =
  "http://127.0.0.1:8000";


const initialForm = {

  pregnancies: "",

  glucose: "",

  blood_pressure: "",

  skin_thickness: "",

  insulin: "",

  bmi: "",

  diabetes_pedigree_function: "",

  age: "",
};


const fields = [

  [
    "pregnancies",
    "Pregnancies",
    "count",
    "0–20",
  ],

  [
    "glucose",
    "Glucose",
    "mg/dL",
    "0–300",
  ],

  [
    "blood_pressure",
    "Blood pressure",
    "mmHg",
    "0–200",
  ],

  [
    "skin_thickness",
    "Skin thickness",
    "mm",
    "0–150",
  ],

  [
    "insulin",
    "Insulin",
    "μU/mL",
    "0–900",
  ],

  [
    "bmi",
    "BMI",
    "index",
    "0–80",
  ],

  [
    "diabetes_pedigree_function",
    "Family-history signal",
    "index",
    "0–3",
  ],

  [
    "age",
    "Age",
    "years",
    "1–120",
  ],
];


function App() {

  const [page, setPage] =
    useState("overview");

  const [dark, setDark] =
    useState(true);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [form, setForm] =
    useState(initialForm);

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [health, setHealth] =
    useState(null);

  const [history, setHistory] =
    useState(() => {

      try {

        return JSON.parse(
          localStorage.getItem(
            "healthai-history"
          ) || "[]"
        );

      } catch {

        return [];

      }

    });


  useEffect(() => {

    fetch(`${API}/api/health`)

      .then((response) =>
        response.json()
      )

      .then(setHealth)

      .catch(() =>

        setHealth({

          status: "offline",

          model_loaded: false,

        })

      );

  }, []);


  useEffect(() => {

    localStorage.setItem(

      "healthai-history",

      JSON.stringify(history)

    );

  }, [history]);


  const systemOnline =
    Boolean(health?.model_loaded);


  const modelAccuracy =
    health?.training_accuracy ?? "--";


  const nav = [

    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
    },

    {
      id: "assessment",
      label: "AI Assessment",
      icon: BrainCircuit,
    },

    {
      id: "insights",
      label: "Explainability",
      icon: Network,
    },

    {
      id: "history",
      label: "Assessment Log",
      icon: History,
    },

  ];


  function navigate(id) {

    setPage(id);

    setMobileOpen(false);

  }


  function changeField(event) {

    setForm((previous) => ({

      ...previous,

      [event.target.name]:
        event.target.value,

    }));

  }


  async function analyze(event) {

    event.preventDefault();

    setLoading(true);

    setError("");

    setResult(null);


    try {

      const payload =
        Object.fromEntries(

          Object.entries(form).map(
            ([key, value]) => [
              key,
              Number(value),
            ]
          )

        );


      const response =
        await fetch(

          `${API}/api/predict`,

          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify(payload),

          }

        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Assessment failed."
        );

      }


      setResult(data);


      setHistory((items) => [

        {

          id: Date.now(),

          createdAt:
            new Date().toLocaleString(),

          probability:
            data.probability,

          category:
            data.category,

          tone:
            data.tone,

          model:
            data.model,

        },

        ...items,

      ].slice(0, 20));


      navigate("insights");


    } catch (err) {

      setError(

        err.message ||
        "Could not connect to AI engine."

      );

    } finally {

      setLoading(false);

    }

  }


  const latest =
    history[0];


  const pageTitle =
    useMemo(() => {

      const current =
        nav.find(
          (item) =>
            item.id === page
        );

      return (
        current?.label ||
        "Overview"
      );

    }, [page]);


  return (

    <div
      className={
        dark
          ? "shell dark"
          : "shell light"
      }
    >

      {/* SIDEBAR */}

      <aside
        className={
          `sidebar ${
            mobileOpen
              ? "open"
              : ""
          }`
        }
      >

        <div className="logo-row">

          <div className="logo-mark">

            <BrainCircuit
              size={21}
            />

          </div>


          <div>

            <div className="logo-name">

              Health<span>AI</span>

            </div>

            <div className="logo-caption">

              INTELLIGENCE PLATFORM

            </div>

          </div>


          <button
            className="icon-button mobile-close"
            onClick={() =>
              setMobileOpen(false)
            }
          >

            <X size={18} />

          </button>

        </div>


        <div className="system-chip">

          <span
            className={
              systemOnline
                ? "live-dot"
                : "live-dot offline"
            }
          />

          <div>

            <strong>

              {
                systemOnline
                  ? "AI engine online"
                  : "Engine offline"
              }

            </strong>

            <small>
              Local inference service
            </small>

          </div>

        </div>


        <div className="nav-section-label">
          WORKSPACE
        </div>


        <nav>

          {nav.map((item) => {

            const Icon =
              item.icon;

            return (

              <button

                key={item.id}

                className={
                  page === item.id
                    ? "nav-item active"
                    : "nav-item"
                }

                onClick={() =>
                  navigate(item.id)
                }

              >

                <Icon size={18} />

                <span>
                  {item.label}
                </span>

                {
                  page === item.id &&
                  <ChevronRight
                    size={15}
                  />
                }

              </button>

            );

          })}

        </nav>


        <div className="sidebar-bottom">

          <div className="privacy-card">

            <ShieldCheck
              size={18}
            />

            <div>

              <strong>
                Privacy by design
              </strong>

              <span>
                Assessments stay in
                this browser history.
              </span>

            </div>

          </div>


          <button
            className="nav-item"
            onClick={() =>
              navigate("about")
            }
          >

            <CircleHelp
              size={18}
            />

            <span>
              About HealthAI
            </span>

          </button>

        </div>

      </aside>


      {
        mobileOpen &&

        <div
          className="backdrop"
          onClick={() =>
            setMobileOpen(false)
          }
        />

      }


      <section className="main">

        {/* TOP BAR */}

        <header className="topbar">

          <button
            className="icon-button mobile-menu"
            onClick={() =>
              setMobileOpen(true)
            }
          >

            <Menu size={20} />

          </button>


          <div>

            <div className="breadcrumb">

              WORKSPACE /
              {" "}
              {pageTitle.toUpperCase()}

            </div>

            <h2>
              {pageTitle}
            </h2>

          </div>


          <div className="top-actions">

            <button
              className="icon-button"
              onClick={() =>
                setDark(
                  (value) =>
                    !value
                )
              }
            >

              {
                dark
                  ? <Sun size={18} />
                  : <Moon size={18} />
              }

            </button>


            <div className="avatar">
              HA
            </div>

          </div>

        </header>


        <main className="content">

          {
            page === "overview" &&

            <Overview

              systemOnline={
                systemOnline
              }

              modelAccuracy={
                modelAccuracy
              }

              history={
                history
              }

              latest={
                latest
              }

              onAssessment={() =>
                navigate("assessment")
              }

            />
          }


          {
            page === "assessment" &&

            <Assessment

              form={form}

              changeField={
                changeField
              }

              analyze={
                analyze
              }

              loading={
                loading
              }

              error={
                error
              }

              reset={() => {

                setForm(
                  initialForm
                );

                setError("");

              }}

            />
          }


          {
            page === "insights" &&

            <Insights

              result={
                result
              }

              latest={
                latest
              }

              onAssessment={() =>
                navigate("assessment")
              }

            />
          }


          {
            page === "history" &&

            <HistoryPage

              history={
                history
              }

              clear={() =>
                setHistory([])
              }

            />
          }


          {
            page === "about" &&
            <About />
          }

        </main>


        <footer className="footer">

          <span>
            HEALTHAI / 2.0
          </span>

          <span>
            Educational AI prototype
            • Not a medical device
          </span>

        </footer>

      </section>

    </div>

  );
}


/* ============================================================
   OVERVIEW
============================================================ */

function Overview({

  systemOnline,

  modelAccuracy,

  history,

  latest,

  onAssessment,

}) {

  return (

    <>

      <section className="hero-grid">

        <div className="hero-card">

          <div className="eyebrow">

            <Sparkles size={14} />

            HEALTH INTELLIGENCE CONSOLE

          </div>


          <h1>

            Turn health data into

            {" "}

            <span>
              understandable signals.
            </span>

          </h1>


          <p>

            A company-style AI interface
            for exploring model-based
            health-risk estimates,
            feature influence and
            assessment history.

          </p>


          <div className="hero-actions">

            <button
              className="primary"
              onClick={onAssessment}
            >

              Start AI assessment

              <ArrowUpRight
                size={17}
              />

            </button>


            <div className="micro-note">

              <ShieldCheck
                size={14}
              />

              Educational •
              Transparent •
              Local

            </div>

          </div>

        </div>


        <div className="hero-orbit-card">

          <div
            className="orbital orbital-a"
          />

          <div
            className="orbital orbital-b"
          />


          <div className="core">

            <HeartPulse
              size={38}
            />

            <span>
              AI
            </span>

          </div>


          <div className="orbit-label label-a">

            <Zap size={13} />

            SIGNAL

          </div>


          <div className="orbit-label label-b">

            <Target size={13} />

            MODEL

          </div>

        </div>

      </section>


      <section className="metric-grid">

        <Metric

          icon={<Activity />}

          label="Engine status"

          value={
            systemOnline
              ? "ONLINE"
              : "OFFLINE"
          }

          detail="FastAPI inference"

        />


        <Metric

          icon={<Gauge />}

          label="Training accuracy"

          value={
            modelAccuracy === "--"
              ? "--"
              : `${modelAccuracy}%`
          }

          detail="Training set only"

        />


        <Metric

          icon={<History />}

          label="Local assessments"

          value={
            history.length
          }

          detail="Saved in browser"

        />


        <Metric

          icon={<Network />}

          label="Features analyzed"

          value="08"

          detail="Structured signals"

        />

      </section>


      <section className="two-col">

        <div className="panel">

          <PanelTitle

            icon={<BarChart3 />}

            title="Assessment pulse"

            action="Last 20 sessions"

          />


          {
            history.length === 0

              ?

              <EmptyState
                text={
                  "No assessments yet. " +
                  "Your first analysis " +
                  "will appear here."
                }
              />

              :

              <div className="pulse-chart">

                {
                  history
                    .slice(0, 10)
                    .reverse()
                    .map((item) => (

                      <div
                        className="bar-wrap"
                        key={item.id}
                      >

                        <div
                          className="bar"
                          style={{
                            height:
                              `${Math.max(
                                8,
                                item.probability
                              )}%`
                          }}
                        />

                        <span>
                          {
                            Math.round(
                              item.probability
                            )
                          }%
                        </span>

                      </div>

                    ))
                }

              </div>
          }

        </div>


        <div className="panel">

          <PanelTitle

            icon={<Clock3 />}

            title="Latest signal"

            action={
              latest
                ? latest.createdAt
                : "Awaiting data"
            }

          />


          {
            latest

              ?

              <div className="latest-card">

                <div
                  className={
                    `risk-ring ${
                      latest.tone
                    }`
                  }
                >

                  <span>
                    {
                      Math.round(
                        latest.probability
                      )
                    }%
                  </span>

                </div>


                <div>

                  <small>
                    MODEL ESTIMATE
                  </small>

                  <h3>
                    {latest.category}
                  </h3>

                  <p>

                    Generated by
                    {" "}
                    {latest.model}.
                    This is an
                    educational
                    model output.

                  </p>

                </div>

              </div>

              :

              <EmptyState
                text={
                  "Run an assessment to " +
                  "populate the latest signal."
                }
              />

          }

        </div>

      </section>

    </>

  );
}


/* ============================================================
   ASSESSMENT
============================================================ */

function Assessment({

  form,

  changeField,

  analyze,

  loading,

  error,

  reset,

}) {

  return (

    <>

      <div className="page-intro">

        <div>

          <div className="eyebrow">

            <BrainCircuit
              size={14}
            />

            INFERENCE WORKSPACE

          </div>


          <h1>
            AI Health Assessment
          </h1>


          <p>

            Enter the eight structured
            features used by the current
            educational model.

          </p>

        </div>


        <div className="model-pill">

          <span />

          LOGISTIC REGRESSION /
          v2.0

        </div>

      </div>


      <div className="assessment-layout">

        <form
          className="panel form-panel"
          onSubmit={analyze}
        >

          <div className="form-head">

            <div>

              <small>
                INPUT VECTOR
              </small>

              <h3>
                Health snapshot
              </h3>

            </div>


            <div className="secure">

              <ShieldCheck
                size={15}
              />

              Browser session

            </div>

          </div>


          <div className="field-grid">

            {
              fields.map(
                ([
                  name,
                  label,
                  unit,
                  range,
                ]) => (

                  <label
                    className="field"
                    key={name}
                  >

                    <span>

                      {label}

                      <em>
                        {unit}
                      </em>

                    </span>


                    <input

                      name={name}

                      value={
                        form[name]
                      }

                      onChange={
                        changeField
                      }

                      placeholder={
                        range
                      }

                      type="number"

                      step="any"

                      required

                    />

                  </label>

                )
              )
            }

          </div>


          {error && (

            <div className="error-box" role="alert">

              <Info size={16} />

              <span>{error}</span>

            </div>

          )}


          <div className="form-footer">

            <button
              className="secondary"
              type="button"
              onClick={reset}
            >

              Reset

            </button>


            <button
              className="primary"
              type="submit"
              disabled={loading}
            >

              {
                loading

                  ?

                  <>

                    <RefreshCw
                      size={17}
                      className="spin"
                    />

                    Running model...

                  </>

                  :

                  <>

                    Generate insight

                    <ArrowUpRight
                      size={17}
                    />

                  </>
              }

            </button>

          </div>

        </form>


        <div className="panel guidance">

          <div className="mini-icon">

            <Sparkles
              size={19}
            />

          </div>


          <small>
            HOW IT WORKS
          </small>


          <h3>
            From numbers to signals.
          </h3>


          <p>

            The backend preprocesses
            the input, applies the
            trained model, and returns
            an estimated probability
            plus the strongest model
            coefficients influencing
            the score.

          </p>


          <div className="steps">

            <Step
              n="01"
              title="Validate"
              text="Range-check the input vector."
            />

            <Step
              n="02"
              title="Transform"
              text="Impute and standardize features."
            />

            <Step
              n="03"
              title="Infer"
              text="Run the trained classifier."
            />

            <Step
              n="04"
              title="Explain"
              text="Surface model feature influence."
            />

          </div>

        </div>

      </div>


      <div className="notice-banner">

        <ShieldCheck size={18} />

        <div>

          <strong>
            Educational use only.
          </strong>

          <span>

            HealthAI does not diagnose
            disease or recommend
            treatment. A model estimate
            may be inaccurate.

          </span>

        </div>

      </div>

    </>

  );
}


/* ============================================================
   INSIGHTS
============================================================ */

function Insights({

  result,

  latest,

  onAssessment,

}) {

  if (!result && !latest) {

    return (

      <div className="empty-page">

        <div className="mini-icon">

          <Network size={22} />

        </div>


        <h1>
          No insight yet
        </h1>


        <p>

          Run an AI assessment first
          to unlock the explainability
          view.

        </p>


        <button
          className="primary"
          onClick={onAssessment}
        >

          Open assessment

          <ArrowUpRight
            size={17}
          />

        </button>

      </div>

    );

  }


  const data =
    result || latest;


  const probability =
    data.probability;


  return (

    <>

      <div className="page-intro">

        <div>

          <div className="eyebrow">

            <Network size={14} />

            EXPLAINABLE AI

          </div>


          <h1>
            Model Insight
          </h1>


          <p>

            See the result and the
            feature signals exposed
            by the current model.

          </p>

        </div>


        <button
          className="secondary"
          onClick={onAssessment}
        >

          New assessment

        </button>

      </div>


      <div className="insight-grid">

        <div className="panel score-panel">

          <small>
            MODEL-ESTIMATED PROBABILITY
          </small>


          <div className="big-score">

            {probability}

            <span>
              %
            </span>

          </div>


          <div className="score-track">

            <div
              style={{
                width:
                  `${probability}%`
              }}
            />

          </div>


          <div
            className={
              `category ${
                data.tone
              }`
            }
          >

            {data.category}

          </div>


          <p className="muted">

            This percentage is an
            output of the trained model,
            not a diagnosis or certainty
            about an individual's health.

          </p>

        </div>


        <div className="panel">

          <PanelTitle

            icon={<Network />}

            title="Feature influence"

            action="Top signals"

          />


          {
            result?.explanation

              ?

              <div className="feature-list">

                {
                  result.explanation.map(
                    (item) => (

                      <div
                        className="feature-row"
                        key={
                          item.feature
                        }
                      >

                        <div>

                          <strong>
                            {item.feature}
                          </strong>

                          <span>
                            {
                              item.direction
                            }
                          </span>

                        </div>


                        <div className="weight">

                          {
                            item.weight > 0
                              ? "+"
                              : ""
                          }

                          {item.weight}

                        </div>

                      </div>

                    )
                  )
                }

              </div>

              :

              <EmptyState
                text={
                  "Run a new assessment " +
                  "to see detailed feature influence."
                }
              />

          }

        </div>

      </div>


      <div className="notice-banner">

        <Info size={18} />

        <div>

          <strong>
            How to read this screen.
          </strong>

          <span>

            Positive/negative coefficient
            direction describes the model's
            mathematical influence, not a
            medical cause-and-effect
            relationship.

          </span>

        </div>

      </div>

    </>

  );
}


/* ============================================================
   HISTORY
============================================================ */

function HistoryPage({

  history,

  clear,

}) {

  return (

    <>

      <div className="page-intro">

        <div>

          <div className="eyebrow">

            <History size={14} />

            LOCAL ASSESSMENT LOG

          </div>


          <h1>
            Assessment History
          </h1>


          <p>

            Recent results stored
            locally in this browser.

          </p>

        </div>


        <button
          className="secondary"
          onClick={clear}
          disabled={
            !history.length
          }
        >

          Clear local log

        </button>

      </div>


      <div className="panel table-panel">

        {
          history.length === 0

            ?

            <EmptyState
              text={
                "No local assessments " +
                "have been recorded."
              }
            />

            :

            <div className="table">

              <div
                className={
                  "table-row table-head"
                }
              >

                <span>
                  TIME
                </span>

                <span>
                  ESTIMATE
                </span>

                <span>
                  STATUS
                </span>

                <span>
                  MODEL
                </span>

              </div>


              {
                history.map(
                  (item) => (

                    <div
                      className="table-row"
                      key={item.id}
                    >

                      <span>
                        {item.createdAt}
                      </span>

                      <strong>
                        {item.probability}%
                      </strong>

                      <span
                        className={
                          `tag ${item.tone}`
                        }
                      >

                        {
                          item.category.replace(
                            " model-estimated risk",
                            ""
                          )
                        }

                      </span>

                      <span>
                        {item.model}
                      </span>

                    </div>

                  )
                )
              }

            </div>
        }

      </div>

    </>

  );
}


/* ============================================================
   ABOUT
============================================================ */

function About() {

  return (

    <div className="about-grid">

      <div className="hero-card">

        <div className="eyebrow">

          <Sparkles size={14} />

          ABOUT THE PROJECT

        </div>


        <h1>

          HealthAI is a

          {" "}

          <span>
            student-built AI product concept.
          </span>

        </h1>


        <p>

          The interface demonstrates
          how an AI/ML project can
          combine a machine-learning
          model, API layer,
          explainability, product design
          and responsible communication
          in one experience.

        </p>

      </div>


      <div className="panel">

        <PanelTitle

          icon={<ShieldCheck />}

          title="Responsible AI"

          action="Principles"

        />


        <div className="principle">

          <strong>
            Transparent
          </strong>

          <span>
            Model and feature
            influence are visible.
          </span>

        </div>


        <div className="principle">

          <strong>
            Bounded
          </strong>

          <span>
            Inputs are validated
            before inference.
          </span>

        </div>


        <div className="principle">

          <strong>
            Educational
          </strong>

          <span>
            Outputs are framed as
            model estimates.
          </span>

        </div>


        <div className="principle">

          <strong>
            Privacy-aware
          </strong>

          <span>
            History is kept locally
            in the browser.
          </span>

        </div>

      </div>

    </div>

  );
}


/* ============================================================
   SMALL COMPONENTS
============================================================ */

function Metric({

  icon,

  label,

  value,

  detail,

}) {

  return (

    <div className="metric">

      <div className="metric-icon">

        {icon}

      </div>


      <div>

        <small>
          {label}
        </small>

        <strong>
          {value}
        </strong>

        <span>
          {detail}
        </span>

      </div>

    </div>

  );
}


function PanelTitle({

  icon,

  title,

  action,

}) {

  return (

    <div className="panel-title">

      <div>

        {icon}

        <strong>
          {title}
        </strong>

      </div>


      <span>
        {action}
      </span>

    </div>

  );
}


function EmptyState({

  text,

}) {

  return (

    <div className="empty-state">

      <Activity size={20} />

      <p>
        {text}
      </p>

    </div>

  );
}


function Step({

  n,

  title,

  text,

}) {

  return (

    <div className="step">

      <span>
        {n}
      </span>


      <div>

        <strong>
          {title}
        </strong>

        <p>
          {text}
        </p>

      </div>

    </div>

  );
}


export default App;