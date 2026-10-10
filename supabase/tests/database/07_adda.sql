-- Adda: building, inviting after a wave, answering, the 30-person cap, privacy of a "no",
-- free waves on joining, leaving and blocking (docs/prd/adda.md).
begin;
\ir _helpers.inc
select plan(33);

create temp table cast_ as
select tests.join('Asha Rao', '{privacy}', 'asha_builds', null) as asha,
       tests.join('Ravi Kumar', '{privacy,core}', 'ravi_builds', null) as ravi,
       tests.join('Mei Lin', '{defi}', 'mei_builds', null) as mei;

-- ---- building -----------------------------------------------------------------------------------
select tests.act((select asha from cast_));
select is(public.invite_to_adda((select ravi from cast_)), 'needs_adda',
  'no invites before you build an adda');
select throws_ok($$select public.save_adda('igloo', 'rani')$$, 'coii:invalid_style',
  'only the three tent styles');
select throws_ok($$select public.save_adda('tambu', 'black')$$, 'coii:invalid_color',
  'only the six colours');
select lives_ok($$select public.save_adda('tambu', 'leaf')$$, 'building an adda works');
select lives_ok($$select public.save_adda('chhatri', 'rani')$$, 'and changing its look');
select is(public.get_adda_state() -> 'adda', '{"style":"chhatri","color":"rani"}'::jsonb,
  'the state shows the latest look');

-- ---- inviting -----------------------------------------------------------------------------------
select is(public.invite_to_adda((select ravi from cast_)), 'needs_wave',
  'you have to wave before you invite');
select is(tests.wave((select asha from cast_), (select ravi from cast_)), 'waved', 'Asha waves at Ravi');
select tests.act((select asha from cast_));
select is(public.invite_to_adda((select ravi from cast_)), 'invited', 'then the invite goes out');
select is(public.invite_to_adda((select ravi from cast_)), 'already', 'inviting twice is "already"');
select is(public.invite_to_adda((select asha from cast_)), 'unavailable', 'you can''t invite yourself');
select is(public.invite_to_adda(gen_random_uuid()), 'unavailable', 'or nobody');
select is(public.get_adda_state() -> 'members' -> 0 ->> 'status', 'invited',
  'Asha sees Ravi as invited');

select tests.act((select ravi from cast_));
select is(public.get_adda_state() -> 'invites' -> 0 ->> 'owner_id', (select asha from cast_)::text,
  'Ravi sees who invited him');

-- ---- a "no" is never signalled ------------------------------------------------------------------
select is(public.respond_to_adda_invite((select asha from cast_), false), 'declined', 'Ravi says not now');
select is(public.get_adda_state() -> 'invites', '[]'::jsonb, 'the invite leaves Ravi''s list');
select is(public.respond_to_adda_invite((select asha from cast_), true), 'unavailable',
  'a declined invite can''t be answered again');
select tests.act((select asha from cast_));
select is(public.get_adda_state() -> 'members' -> 0 ->> 'status', 'invited',
  'Asha still sees Ravi as invited: the no stays private');
select is(public.invite_to_adda((select ravi from cast_)), 'already',
  'and re-inviting just says "already"');

-- ---- joining: a free wave back makes a chai -----------------------------------------------------
select is(tests.wave((select asha from cast_), (select mei from cast_)), 'waved', 'Asha waves at Mei');
select tests.act((select asha from cast_));
select is(public.invite_to_adda((select mei from cast_)), 'invited', 'and invites her');
select tests.act((select mei from cast_));
select is(public.respond_to_adda_invite((select asha from cast_), true), 'joined', 'Mei joins');
select is((public.get_meet_state() ->> 'waves_left')::int, 50,
  'joining doesn''t use one of Mei''s 50 daily waves');
select is((select count(*)::int from private.chais
           where a_id = least((select asha from cast_), (select mei from cast_))
             and b_id = greatest((select asha from cast_), (select mei from cast_))), 1,
  'joining makes a chai with the owner');
select is((select wave_points from private.people where id = (select asha from cast_)), 1,
  'and gives the owner a wave point');
select is(public.get_adda_state() -> 'joined' -> 0 ->> 'owner_id', (select asha from cast_)::text,
  'Mei sees the adda she is in');
select tests.act((select asha from cast_));
select is((select m ->> 'status' from jsonb_array_elements(public.get_adda_state() -> 'members') m
           where m ->> 'id' = (select mei from cast_)::text), 'joined',
  'Asha sees Mei as joined');

-- ---- leaving ------------------------------------------------------------------------------------
select tests.act((select mei from cast_));
select public.leave_adda((select asha from cast_));
select is(public.get_adda_state() -> 'joined', '[]'::jsonb, 'Mei left Asha''s adda');

-- ---- the 30-person cap --------------------------------------------------------------------------
create temp table crowd as
  select tests.demo('Demo ' || n, '{privacy}') as id, n from generate_series(1, 30) as n;
select tests.act((select asha from cast_));
select is((select count(*)::int from crowd c where public.wave(c.id) ->> 'result' = 'waved'), 30,
  'Asha waves at 30 more people');
select is((select count(*)::int from crowd c
           where n <= 29 and public.invite_to_adda(c.id) = 'invited'), 29,
  '29 more invites fill the adda to 30 with Ravi');
select is(public.invite_to_adda((select id from crowd where n = 30)), 'full',
  'the 31st person doesn''t fit');

-- ---- blocking ends adda ties --------------------------------------------------------------------
select tests.act((select ravi from cast_));
select public.block((select asha from cast_));
select is((select count(*)::int from private.adda_members
           where owner_id = (select asha from cast_) and member_id = (select ravi from cast_)), 0,
  'blocking removes the adda link both ways');

select ok(tests.points_consistent(), 'wave_points and daily_points still match a full recount');

select * from finish();
rollback;
