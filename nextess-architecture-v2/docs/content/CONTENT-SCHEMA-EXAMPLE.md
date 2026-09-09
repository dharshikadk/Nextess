# Content Schema Example

```yaml
project:
  key: electric-charging-system
  subject: physics
  version: 1
  anonymousAccess: true
  title: Charging System Investigation

  levels:
    - number: 1
      questions:
        - number: 1
          type: diagnosis
          evaluator:
            type: choice
        - number: 2
          type: quantitative-investigation
          evaluator:
            type: numeric
        - number: 3
          type: what-if
          evaluator:
            type: rule-set
        - number: 4
          type: engineering-decision
          evaluator:
            type: configuration
```

Every published content package must define version, evaluator, explanation, hints, consequences, units/constraints and referenced simulation variables.
