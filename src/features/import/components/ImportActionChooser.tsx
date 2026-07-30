import {
  Card,
  CardContent,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';

import type { ImportAction } from '../types';

const OPTIONS: { value: ImportAction; title: string; description: string }[] = [
  {
    value: 'skip_existing',
    title: 'Skip Existing',
    description:
      'Import brand-new customers and skip anyone who already exists (matched by mobile number, then email). Existing records are left completely unchanged.',
  },
  {
    value: 'update_existing',
    title: 'Update Existing',
    description:
      'Import new customers AND refresh the details of anyone who already exists with the values from your file.',
  },
  {
    value: 'import_new_only',
    title: 'Import New Only',
    description:
      'Add only customers who are not already in the system. Existing customers are ignored entirely.',
  },
];

export function ImportActionChooser({
  value,
  onChange,
  disabled = false,
}: {
  value: ImportAction | null;
  onChange: (action: ImportAction) => void;
  disabled?: boolean;
}) {
  return (
    <RadioGroup
      value={value ?? ''}
      onChange={(event) => {
        onChange(event.target.value as ImportAction);
      }}
    >
      <Stack spacing={1.5}>
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <Card
              key={option.value}
              variant="outlined"
              sx={{
                borderColor: selected ? 'primary.main' : 'divider',
                borderWidth: selected ? 2 : 1,
              }}
            >
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <FormControlLabel
                  value={option.value}
                  disabled={disabled}
                  sx={{ alignItems: 'flex-start', m: 0 }}
                  control={<Radio sx={{ mt: 0.5 }} />}
                  label={
                    <span>
                      <Typography sx={{ fontWeight: 600 }}>
                        {option.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                    </span>
                  }
                />
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </RadioGroup>
  );
}
