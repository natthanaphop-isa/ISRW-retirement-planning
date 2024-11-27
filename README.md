# 🎈 Retirement Planning by Isara Wealth

This project is a retirement planning simulation application built using **Streamlit**, **NumPy**, **Pandas**, and **Plotly**. The app helps users simulate the growth and depletion of their retirement funds, incorporating factors such as inflation, annual contributions, expected returns, and retirement expenses.

A simple Streamlit app template for you to modify!

[![Open in Streamlit](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://isrw-retirement-plan.streamlit.app)

---

## Features
- **Interactive User Interface**: Users can input their details such as current age, retirement age, life expectancy, annual contributions, expenses, and expected returns using interactive sliders and input fields.
- **Retirement Simulation**:
  - Simulates fund growth during the accumulation phase.
  - Models expenses and returns during the post-retirement phase.
  - Calculates whether the user's retirement fund will last until the end of their life expectancy.
  - Determines the inheritance or remaining fund balance after life expectancy.
- **Dynamic Visualization**:
  - Visualizes fund growth and cumulative expenses using an interactive Plotly chart.
  - Highlights key milestones like retirement age and life expectancy.
- **Recommendation System**:
  - Provides feedback on whether the retirement plan is sufficient.
  - Suggests actionable steps if the fund is insufficient (e.g., increasing annual contributions, extending retirement age, etc.).

---

## Getting Started

### Prerequisites
Make sure you have the following installed on your system:
- Python 3.8 or higher
- Streamlit
- NumPy
- Pandas
- Plotly

### How to run it on your own machine

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/retirement-planning.git
   cd retirement-planning

2. Install the requirements

   ```
   $ pip install -r requirements.txt
   ```

3. Run the app

   ```
   $ streamlit run streamlit_app.py
   ```
