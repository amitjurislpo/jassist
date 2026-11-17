-- The first checkers, as given in the CTO's JurisAssist blog work order of 17 Nov 2026. Safe to run twice.
insert into blog_checker (email, note) values
  ('gopal@jurislpo.com', 'Work order 17 Nov 2026'),
  ('ritz@jurislpo.com',  'Work order 17 Nov 2026'),
  ('amit@jurislpo.com',  'Work order 17 Nov 2026')
on conflict (email) do nothing;
