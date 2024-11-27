# 🎈 Isara Wealth - Retirement Planning

A simple Streamlit app template for you to modify!

[![Open in Streamlit](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://isrw-retirement-plan.streamlit.app)

## Explanation of Parameters

This application simulates the growth and depletion of a retirement fund based on various financial and demographic parameters. Below is a detailed explanation of each parameter:

---

### 1. Current Age
- **Description:** The user's current age.
- **Purpose:** Determines the starting point of the simulation and the number of years remaining until retirement.
- **Impact:** The younger the current age, the more time there is to accumulate savings through contributions and investment growth.

---

### 2. Retirement Age
- **Description:** The age at which the user plans to retire.
- **Purpose:** Marks the transition from the accumulation phase (pre-retirement) to the withdrawal phase (post-retirement).
- **Impact:** A later retirement age increases the savings period and decreases the withdrawal period, making the plan more likely to succeed.

---

### 3. Life Expectancy
- **Description:** The age the user expects to live until.
- **Purpose:** Determines the length of the post-retirement period during which withdrawals will occur.
- **Impact:** A higher life expectancy increases the duration of withdrawals, requiring a larger retirement fund.

---

### 4. Starting Principal
- **Description:** The amount of money available in the retirement fund at the start of the simulation.
- **Purpose:** Acts as the initial base for investment growth and contributions.
- **Impact:** A higher starting principal reduces the reliance on contributions and investment returns to fund retirement.

---

### 5. Annual Contribution
- **Description:** The amount of money contributed annually to the retirement fund during the pre-retirement period.
- **Purpose:** Increases the fund balance during the accumulation phase.
- **Impact:** Larger contributions lead to a higher retirement fund, reducing the likelihood of running out of money during retirement.

---

### 6. Annual Expense in Retirement
- **Description:** The estimated annual amount of money required to cover expenses during retirement.
- **Purpose:** Simulates the withdrawals needed during the post-retirement phase.
- **Impact:** Higher expenses require a larger retirement fund and may lead to fund depletion if not adequately planned.

---

### 7. Inflation Rate
- **Description:** The annual percentage increase in the cost of living.
- **Purpose:** Adjusts the annual expenses in retirement to account for the decreasing purchasing power of money over time.
- **Impact:** A higher inflation rate increases future expenses, requiring a larger fund to sustain retirement.

---

### 8. Annualized Return (Pre-Retirement)
- **Description:** The expected annual rate of return on investments during the early pre-retirement period.
- **Purpose:** Models the growth of the retirement fund during the accumulation phase.
- **Impact:** A higher return rate accelerates fund growth, potentially reducing the required contributions or initial principal.

---

### 9. Annualized Return (Final Years Pre-Retirement)
- **Description:** The expected annual rate of return on investments during the last few years before retirement.
- **Purpose:** Reflects a more conservative investment strategy closer to retirement to reduce risk.
- **Impact:** Lower returns in the final years may slow fund growth but provide greater stability and risk reduction.

---

### 10. Years of Final Return Rate Before Retirement
- **Description:** The number of years before retirement when the conservative return rate is applied.
- **Purpose:** Defines the transition period to a safer investment strategy.
- **Impact:** Longer periods of conservative returns may reduce fund growth but mitigate risk near retirement.

---

### 11. Annualized Return (Post-Retirement)
- **Description:** The expected annual rate of return on investments during the post-retirement period.
- **Purpose:** Models the growth of remaining funds while withdrawals are being made.
- **Impact:** A higher return rate helps sustain the fund longer, but excessive risk may lead to volatility.

---

These parameters work together to model the accumulation, growth, and depletion of a retirement fund. Adjusting them allows users to see how changes in contributions, expenses, investment returns, and retirement timing affect the success of their retirement plan.


### How to run it on your own machine

1. Install the requirements

   ```
   $ pip install -r requirements.txt
   ```

2. Run the app

   ```
   $ streamlit run streamlit_app.py
   ```
