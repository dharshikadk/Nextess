# Example Content Schema

This is a conceptual example, not a final database schema.

```yaml
project:
  key: electric-charging-system
  subject: physics
  version: 1
  title: Charging System Investigation
  mission: Keep the charging system inside safe operating limits.
  role: Junior systems engineer

  caseFiles:
    - key: maintenance-report
      displayMode: report
    - key: operating-data
      displayMode: table

  levels:
    - number: 1
      title: Identify the failure
      learningObjectives:
        - identify the physical quantity linked to the failure
      simulation:
        key: electric-field-plate-system
        variables:
          - potentialA
          - potentialB
          - separationCm
          - chargeMicroC

      questions:
        - number: 1
          type: diagnosis
          prompt: >
            The system begins failing after the voltage is changed.
            What physical quantity should be investigated first?
          hints:
            - What exactly changes when the voltage difference changes?
            - Which quantity describes the electrical condition between the plates?
          evaluator:
            type: choice
            acceptedKeys: [electric-field]

        - number: 2
          type: quantitative-investigation
          prompt: >
            At what potential difference should the system reach its limit?
          evaluator:
            type: numeric
            tolerance: 0.01

        - number: 3
          type: what-if
          evaluator:
            type: rule-set

        - number: 4
          type: engineering-decision
          evaluator:
            type: configuration
```

Every real content package must additionally define:

- units
- constraints
- consequence rules
- explanation
- reward configuration
- version
- evaluator version
- validation metadata
